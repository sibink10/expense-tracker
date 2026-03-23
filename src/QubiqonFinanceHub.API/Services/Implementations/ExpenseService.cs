using Microsoft.EntityFrameworkCore;
using QubiqonFinanceHub.API.Data;
using QubiqonFinanceHub.API.DTOs;
using QubiqonFinanceHub.API.Models.Constants;
using QubiqonFinanceHub.API.Models.Entities;
using QubiqonFinanceHub.API.Models.Enums;
using QubiqonFinanceHub.API.Services.Helpers;
using QubiqonFinanceHub.API.Services.Interfaces;

namespace QubiqonFinanceHub.API.Services.Implementations;

public class ExpenseService : IExpenseService
{
    private readonly FinanceHubDbContext _db;
    private readonly ITenantService _tenant;
    private readonly ICodeGeneratorService _codeGen;
    private readonly IEmailService _email;
    private readonly ILogger<ExpenseService> _log;
    private readonly IStorageService _storage;

    public ExpenseService(FinanceHubDbContext db, ITenantService tenant, ICodeGeneratorService codeGen, IEmailService email, ILogger<ExpenseService> log, IStorageService storage)
    {
        _db = db; _tenant = tenant; _codeGen = codeGen; _email = email; _log = log;
        _storage = storage;
    }

    public async Task<ExpenseDto> CreateAsync(CreateExpenseRequest dto)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var currentEmp = await _tenant.GetCurrentEmployeeAsync();
        var targetEmpId = dto.OnBehalfOfEmployeeId ?? currentEmp.Id;
        var targetEmp = dto.OnBehalfOfEmployeeId.HasValue
            ? await _db.Employees.FindAsync(dto.OnBehalfOfEmployeeId.Value) ?? currentEmp
            : currentEmp;

        var code = await _codeGen.GenerateBillNumberAsync(orgId, "expense");

        var expenseId = Guid.NewGuid(); // Generate ID early for storage path
        var uploadedBills = ResolveUploadedFiles(dto.BillImages, dto.BillImage);
        var documents = await UploadExpenseDocumentsAsync(orgId, expenseId, currentEmp.Id, uploadedBills);
        var billImageUrl = documents.LastOrDefault()?.FileUrl;

        var expense = new ExpenseRequest
        {
            Id = expenseId,
            OrganizationId = orgId,
            ExpenseCode = code,
            EmployeeId = targetEmpId,
            SubmittedByEmployeeId = currentEmp.Id,
            Amount = dto.Amount,
            Purpose = dto.Purpose,
            BillDate = dto.BillDate,
            BillImageUrl = billImageUrl,
            Status = ExpenseStatus.PendingApproval,
            CreatedAt = DateTime.UtcNow
        };

        foreach (var document in documents)
            expense.Documents.Add(document);

        expense.Comments.Add(new ActivityComment
        {
            Id = Guid.NewGuid(),
            ExpenseRequestId = expense.Id,
            CommentByEmployeeId = currentEmp.Id,
            Text = $"Expense submitted for ₹{dto.Amount:N2}.",
            ActionType = CommentActionType.Submitted
        });

        _db.ExpenseRequests.Add(expense);
        await _db.SaveChangesAsync();

        var reviewers = await _db.Employees
            .Where(e => e.OrganizationId == orgId &&
                        e.IsActive &&
                        !e.IsDelete &&
                        !string.IsNullOrWhiteSpace(e.Email) &&
                        e.Role == UserRole.Approver)
            .Select(e => e.Email)
            .Distinct()
            .ToListAsync();

        if (reviewers.Count > 0)
        {
            await _email.SendNotificationAsync(Constants.EmailTemplateKeys.ExpenseSubmitted,
                new Dictionary<string, string>
                {
                    ["link_type"] = "approve",
                    ["entity_type"] = "expense",
                    ["entity_api_id"] = expense.Id.ToString(),
                    ["employee_name"] = targetEmp.FullName,
                    ["expense_id"] = code,
                    ["purpose"] = dto.Purpose,
                    ["amount"] = $"₹{dto.Amount:N2}",
                    ["bill_date"] = dto.BillDate.ToString("dd MMM yyyy"),
                    ["submitted_by"] = currentEmp.FullName,
                    ["submission_notes"] = "",
                    ["action_date"] = DateTime.UtcNow.ToString("dd MMM yyyy hh:mm tt 'UTC'"),
                },
                string.Join(",", reviewers));
        }

        _log.LogInformation("Expense {Code} created by {Employee}", code, currentEmp.FullName);
        return (await GetByIdAsync(expense.Id))!;
    }


    public async Task<ExpenseDto> UploadBillAsync(Guid id, UploadBillRequest dto)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var currentEmployee = await _tenant.GetCurrentEmployeeAsync();
        var empId = currentEmployee.Id;

        var expense = await _db.ExpenseRequests
            .Include(x => x.Documents)
            .Include(x => x.Employee)
            .FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId)
            ?? throw new KeyNotFoundException("Expense not found");

        if (expense.SubmittedByEmployeeId != empId && currentEmployee.Role != UserRole.Admin)
            throw new UnauthorizedAccessException("Only the submitter or an admin can upload the bill.");

        var hasExistingDocuments = HasExpenseDocument(expense);

        if (expense.Status == ExpenseStatus.Rejected || expense.Status == ExpenseStatus.Completed || expense.Status == ExpenseStatus.Cancelled)
            throw new InvalidOperationException($"Bill cannot be uploaded when expense is in '{expense.Status}' status.");

        if ((expense.Status == ExpenseStatus.Approved || expense.Status == ExpenseStatus.AwaitingPayment) && hasExistingDocuments)
            throw new InvalidOperationException("Bill documents have already been uploaded for this approved expense.");

        if (expense.Status != ExpenseStatus.PendingApproval &&
            expense.Status != ExpenseStatus.PendingBillApproval &&
            expense.Status != ExpenseStatus.Approved &&
            expense.Status != ExpenseStatus.AwaitingPayment &&
            expense.Status != ExpenseStatus.AwaitingBill)
            throw new InvalidOperationException("Bill can only be uploaded for pending or approved expenses.");

        var uploadedBills = ResolveUploadedFiles(dto.BillImages, dto.BillImage);
        if (uploadedBills.Count == 0)
            throw new InvalidOperationException("At least one bill document is required.");

        var documents = await UploadExpenseDocumentsAsync(orgId, expense.Id, empId, uploadedBills);
        _db.RequestDocuments.AddRange(documents);

        var newBillUrl = documents.OrderBy(x => x.CreatedAt).LastOrDefault()?.FileUrl ?? expense.BillImageUrl;
        expense.BillImageUrl = newBillUrl;
        expense.Status = expense.Status == ExpenseStatus.PendingApproval || expense.Status == ExpenseStatus.PendingBillApproval
            ? ExpenseStatus.PendingBillApproval
            : ExpenseStatus.AwaitingPayment;
        expense.UpdatedAt = DateTime.UtcNow;

        _db.ActivityComments.Add(new ActivityComment
        {
            Id = Guid.NewGuid(),
            ExpenseRequestId = id,
            CommentByEmployeeId = empId,
            Text = expense.Status == ExpenseStatus.PendingBillApproval
                ? "Bill uploaded. Awaiting bill approval."
                : "Bill uploaded. Awaiting payment.",
            ActionType = CommentActionType.BillUploaded
        });

        await _db.SaveChangesAsync();

        // Bills attached and expense is awaiting payment — notify finance (e.g. after prior approval without bills).
        if (expense.Status == ExpenseStatus.AwaitingPayment)
        {
            var financeEmails = await _db.Employees
                .Where(e => e.OrganizationId == orgId &&
                            e.IsActive &&
                            !e.IsDelete &&
                            !string.IsNullOrWhiteSpace(e.Email) &&
                            e.Role == UserRole.Finance)
                .Select(e => e.Email)
                .Distinct()
                .ToListAsync();

            if (financeEmails.Count > 0)
            {
                var emailVars = new Dictionary<string, string>
                {
                    ["link_type"] = "pay",
                    ["entity_type"] = "expense",
                    ["entity_api_id"] = expense.Id.ToString(),
                    ["employee_name"] = expense.Employee.FullName,
                    ["expense_id"] = expense.ExpenseCode,
                    ["purpose"] = expense.Purpose,
                    ["amount"] = $"₹{expense.Amount:N2}",
                    ["bill_date"] = expense.BillDate.ToString("dd MMM yyyy"),
                    ["status"] = expense.Status.ToString(),
                    ["approver_name"] = currentEmployee.FullName,
                    ["uploaded_by_name"] = currentEmployee.FullName,
                    ["approver_comments"] = "",
                    ["upload_notes"] = "",
                    ["action_date"] = DateTime.UtcNow.ToString("dd MMM yyyy hh:mm tt 'UTC'"),
                };
                await _email.SendNotificationAsync(
                    Constants.EmailTemplateKeys.ExpenseBillUploadedFinance,
                    emailVars,
                    string.Join(",", financeEmails));
            }
        }

        return (await GetByIdAsync(id))!;
    }

    public async Task<ExpenseDto> UpdateAsync(Guid id, UpdateExpenseRequest dto)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var currentEmployee = await _tenant.GetCurrentEmployeeAsync();
        var empId = currentEmployee.Id;

        var expense = await _db.ExpenseRequests
            .Include(x => x.Documents)
            .FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId)
            ?? throw new KeyNotFoundException("Expense not found");

        if (expense.SubmittedByEmployeeId != empId && currentEmployee.Role != UserRole.Admin)
            throw new UnauthorizedAccessException("Only the submitter or an admin can edit this expense.");

        if (expense.Status == ExpenseStatus.Approved ||
            expense.Status == ExpenseStatus.AwaitingPayment ||
            expense.Status == ExpenseStatus.Completed)
            throw new InvalidOperationException("Only pending expenses can be edited.");

        var wasRejected = expense.Status == ExpenseStatus.Rejected;

        var uploadedBills = ResolveUploadedFiles(dto.BillImages, dto.BillImage);
        if (uploadedBills.Count > 0)
        {
            var documents = await UploadExpenseDocumentsAsync(orgId, expense.Id, empId, uploadedBills);
            _db.RequestDocuments.AddRange(documents);
            expense.BillImageUrl = documents
                .OrderBy(x => x.CreatedAt)
                .LastOrDefault()?.FileUrl ?? expense.BillImageUrl;
        }

        expense.Amount = dto.Amount;
        expense.Purpose = dto.Purpose;
        expense.BillDate = dto.BillDate;
        if (wasRejected)
            expense.Status = ExpenseStatus.PendingApproval;
        expense.UpdatedAt = DateTime.UtcNow;

        _db.ActivityComments.Add(new ActivityComment
        {
            Id = Guid.NewGuid(),
            ExpenseRequestId = id,
            CommentByEmployeeId = empId,
            Text = wasRejected
                ? $"Rejected expense updated and resubmitted. Amount: ₹{dto.Amount:N2}."
                : $"Expense updated. Amount: ₹{dto.Amount:N2}."
        });

        await _db.SaveChangesAsync();
        return (await GetByIdAsync(id))!;
    }

    public async Task<ExpenseDto?> GetByIdAsync(Guid id)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var e = await _db.ExpenseRequests
            .Include(x => x.Employee)
            .Include(x => x.Documents)
            .Include(x => x.Comments).ThenInclude(c => c.CommentByEmployee)
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId);

        if (e == null) return null;
        return MapToDto(e);
    }

    public async Task<PaginatedResult<ExpenseDto>> ListAsync(FilterParams f, bool myOnly = false)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var q = _db.ExpenseRequests
            .Include(x => x.Employee)
            .Include(x => x.Documents)
            .Include(x => x.Comments).ThenInclude(c => c.CommentByEmployee)
            .Where(x => x.OrganizationId == orgId)
            .AsNoTracking();

        if (myOnly) { var empId = _tenant.GetCurrentEmployeeId(); q = q.Where(x => x.SubmittedByEmployeeId == empId); }
        if (f.Status != null && Enum.TryParse<ExpenseStatus>(f.Status, true, out var status)) q = q.Where(x => x.Status == status);
        if (!string.IsNullOrWhiteSpace(f.Search))
        {
            var s = f.Search.ToLower();
            q = q.Where(x => x.ExpenseCode.ToLower().Contains(s) || x.Purpose.ToLower().Contains(s) || x.Employee.FullName.ToLower().Contains(s));
        }

        var total = await q.CountAsync();
        q = q.ApplyExpenseSorting(f);
        var items = await q.Skip((f.Page - 1) * f.PageSize).Take(f.PageSize).ToListAsync();

        return new PaginatedResult<ExpenseDto>(items.Select(MapToDto).ToList(), total, f.Page, f.PageSize);
    }

    public async Task<ExpenseDto> ApproveAsync(Guid id, ApproveRequest dto)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var emp = await _tenant.GetCurrentEmployeeAsync();
        var expense = await _db.ExpenseRequests
            .Include(x => x.Employee)
            .Include(x => x.Documents)
            .FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId)
            ?? throw new KeyNotFoundException("Expense not found");

        if (expense.Status == ExpenseStatus.Approved ||
            expense.Status == ExpenseStatus.AwaitingPayment ||
            expense.Status == ExpenseStatus.AwaitingBill ||
            expense.Status == ExpenseStatus.Completed ||
            expense.Status == ExpenseStatus.PartiallyPaid)
            throw new InvalidOperationException("Expense is already approved.");

        var hasDocuments = HasExpenseDocument(expense);
        expense.Status = hasDocuments ? ExpenseStatus.AwaitingPayment : ExpenseStatus.Approved;
        expense.UpdatedAt = DateTime.UtcNow;

        _db.ActivityComments.Add(new ActivityComment
        {
            Id = Guid.NewGuid(),
            ExpenseRequestId = id,
            CommentByEmployeeId = emp.Id,
            Text = dto.Comments ?? (hasDocuments ? "Approved. Awaiting payment." : "Approved. Bill upload is required before payment."),
            ActionType = CommentActionType.Approved
        });

        await _db.SaveChangesAsync();

        var templateKey = hasDocuments
                    ? "expense_approved"
                    : "expense_awaiting_bill";

        var emailVars = new Dictionary<string, string>
        {
            ["link_type"] = hasDocuments ? "pay" : "detail",
            ["entity_type"] = "expense",
            ["entity_api_id"] = expense.Id.ToString(),
            ["employee_name"] = expense.Employee.FullName,
            ["expense_id"] = expense.ExpenseCode,
            ["purpose"] = expense.Purpose,
            ["amount"] = $"₹{expense.Amount:N2}",
            ["bill_date"] = expense.BillDate.ToString("dd MMM yyyy"),
            ["status"] = expense.Status.ToString(),
            ["approver_name"] = emp.FullName,
            ["approver_comments"] = dto.Comments ?? "",
            ["action_date"] = DateTime.UtcNow.ToString("dd MMM yyyy hh:mm tt 'UTC'"),
        };

        var financeEmails = await _db.Employees
            .Where(e => e.OrganizationId == orgId &&
                        e.IsActive &&
                        !e.IsDelete &&
                        !string.IsNullOrWhiteSpace(e.Email) &&
                        e.Role == UserRole.Finance)
            .Select(e => e.Email)
            .Distinct()
            .ToListAsync();

        if (financeEmails.Count > 0)
        {
            await _email.SendNotificationAsync(
                templateKey,
                emailVars,
                string.Join(",", financeEmails));
        }

        // No bills at approval: notify submitter to upload bills for payment (finance email unchanged above).
        if (!hasDocuments)
        {
            var submitterId = expense.SubmittedByEmployeeId ?? expense.EmployeeId;
            var submitter = await _db.Employees.AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == submitterId && x.OrganizationId == orgId);
            if (submitter != null && !string.IsNullOrWhiteSpace(submitter.Email))
            {
                await _email.SendNotificationAsync(
                    Constants.EmailTemplateKeys.ExpenseSubmitterUploadBills,
                    emailVars,
                    submitter.Email.Trim());
            }
            else if (submitter == null)
            {
                _log.LogWarning("Expense {Code}: submitter employee not found for upload-bill email.", expense.ExpenseCode);
            }
            else
            {
                _log.LogWarning("Expense {Code}: submitter has no email; upload-bill notification skipped.", expense.ExpenseCode);
            }
        }

        return (await GetByIdAsync(id))!;
    }

    public async Task<ExpenseDto> RejectAsync(Guid id, RejectRequest dto)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var emp = await _tenant.GetCurrentEmployeeAsync();
        var expense = await _db.ExpenseRequests.Include(x => x.Employee)
            .FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId)
            ?? throw new KeyNotFoundException("Expense not found");

        if (expense.Status == ExpenseStatus.Rejected)
            throw new InvalidOperationException("Expense is already rejected.");

        expense.Status = ExpenseStatus.Rejected;
        expense.UpdatedAt = DateTime.UtcNow;

        _db.ActivityComments.Add(new ActivityComment
        {
            Id = Guid.NewGuid(),
            ExpenseRequestId = id,
            CommentByEmployeeId = emp.Id,
            Text = dto.Comments,
            ActionType = CommentActionType.Rejected
        });

        await _db.SaveChangesAsync();

        await _email.SendNotificationAsync(Constants.EmailTemplateKeys.ExpenseRejected,
            new Dictionary<string, string>
            {
                ["link_type"] = "detail",
                ["entity_type"] = "expense",
                ["entity_api_id"] = expense.Id.ToString(),
                ["employee_name"] = expense.Employee.FullName,
                ["expense_id"] = expense.ExpenseCode,
                ["purpose"] = expense.Purpose,
                ["amount"] = $"₹{expense.Amount:N2}",
                ["bill_date"] = expense.BillDate.ToString("dd MMM yyyy"),
                ["reason"] = dto.Comments,
                ["rejected_by"] = emp.FullName,
                ["action_date"] = DateTime.UtcNow.ToString("dd MMM yyyy hh:mm tt 'UTC'"),
            },
            expense.Employee.Email);

        return (await GetByIdAsync(id))!;
    }

    public async Task<ExpenseDto> CancelAsync(Guid id)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var currentEmployee = await _tenant.GetCurrentEmployeeAsync();
        var empId = currentEmployee.Id;
        var expense = await _db.ExpenseRequests
            .FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId)
            ?? throw new KeyNotFoundException("Expense not found");

        if (expense.EmployeeId != empId && currentEmployee.Role != UserRole.Admin)
            throw new UnauthorizedAccessException("Only the submitter or an admin can cancel.");
        if (expense.Status != ExpenseStatus.PendingApproval) throw new InvalidOperationException("Can only cancel pending expenses.");

        expense.Status = ExpenseStatus.Cancelled;
        expense.UpdatedAt = DateTime.UtcNow;

        _db.ActivityComments.Add(new ActivityComment
        {
            Id = Guid.NewGuid(),
            ExpenseRequestId = id,
            CommentByEmployeeId = empId,
            Text = "Cancelled by submitter.",
            ActionType = CommentActionType.Cancelled
        });

        await _db.SaveChangesAsync();
        return (await GetByIdAsync(id))!;
    }

    public async Task<ExpenseDto> ProcessPaymentAsync(Guid id, ProcessPaymentRequest dto)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var emp = await _tenant.GetCurrentEmployeeAsync();
        var expense = await _db.ExpenseRequests
            .Include(x => x.Employee)
            .Include(x => x.Documents)
            .FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId)
            ?? throw new KeyNotFoundException("Expense not found");

        if (expense.Status != ExpenseStatus.Approved && expense.Status != ExpenseStatus.AwaitingPayment && expense.Status != ExpenseStatus.PartiallyPaid)
            throw new InvalidOperationException("Expense not ready for payment.");

        if (!HasExpenseDocument(expense))
            throw new InvalidOperationException("Bill upload is required before payment.");

        var remainingBefore = expense.Amount - expense.PaidAmount;
        var paidAmount = dto.PaidAmount > 0 ? dto.PaidAmount : expense.Amount;
        if (paidAmount > remainingBefore)
            throw new InvalidOperationException($"Paid amount (₹{paidAmount:N2}) cannot exceed the remaining balance (₹{remainingBefore:N2}).");
        expense.PaidAmount += paidAmount;
        expense.PaymentReference = dto.PaymentReference;
        expense.UpdatedAt = DateTime.UtcNow;
        expense.Status = expense.PaidAmount >= expense.Amount ? ExpenseStatus.Completed : ExpenseStatus.PartiallyPaid;
        var balanceDueAfter = Math.Max(0, expense.Amount - expense.PaidAmount);

        _db.ActivityComments.Add(new ActivityComment
        {
            Id = Guid.NewGuid(),
            ExpenseRequestId = id,
            CommentByEmployeeId = emp.Id,
            Text = $"Payment released. Amount: ₹{paidAmount:N2}. Ref: {dto.PaymentReference}",
            ActionType = CommentActionType.PaymentProcessed
        });

        await _db.SaveChangesAsync();

        await _email.SendNotificationAsync(Constants.EmailTemplateKeys.PaymentConfirmation,
            new Dictionary<string, string>
            {
                ["link_type"] = "detail",
                ["entity_type"] = "expense",
                ["entity_api_id"] = expense.Id.ToString(),
                ["employee_name"] = expense.Employee.FullName,
                ["expense_id"] = expense.ExpenseCode,
                ["purpose"] = expense.Purpose,
                ["amount"] = $"₹{expense.Amount:N2}",
                ["paid_amount"] = $"₹{expense.PaidAmount:N2}",
                ["balance_due"] = $"₹{balanceDueAfter:N2}",
                ["bill_date"] = expense.BillDate.ToString("dd MMM yyyy"),
                ["payment_reference"] = dto.PaymentReference,
                ["processed_by"] = emp.FullName,
                ["payment_notes"] = dto.Notes ?? "",
                ["action_date"] = DateTime.UtcNow.ToString("dd MMM yyyy hh:mm tt 'UTC'"),
            },
            expense.Employee.Email);

        return (await GetByIdAsync(id))!;
    }

    public async Task AttachBillAsync(Guid id, string billImageUrl)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var expense = await _db.ExpenseRequests
            .Include(x => x.Documents)
            .FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId)
            ?? throw new KeyNotFoundException("Expense not found");

        expense.BillImageUrl = billImageUrl;
        var currentEmployee = await _tenant.GetCurrentEmployeeAsync();
        expense.Documents.Add(new RequestDocument
        {
            Id = Guid.NewGuid(),
            OrganizationId = orgId,
            ExpenseRequestId = expense.Id,
            UploadedByEmployeeId = currentEmployee.Id,
            FileName = GetFileNameFromUrl(billImageUrl),
            ContentType = null,
            FileSizeBytes = 0,
            FileUrl = billImageUrl,
            CreatedAt = DateTime.UtcNow
        });
        if (expense.Status == ExpenseStatus.AwaitingBill || expense.Status == ExpenseStatus.Approved) expense.Status = ExpenseStatus.AwaitingPayment;
        expense.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
    }

    public async Task<string> GetBillUrlAsync(Guid id)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var expense = await _db.ExpenseRequests
            .Include(x => x.Documents)
            .FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId)
            ?? throw new KeyNotFoundException("Expense not found");

        var fileUrl = expense.Documents
            .OrderBy(x => x.CreatedAt)
            .LastOrDefault()?.FileUrl ?? expense.BillImageUrl;

        if (fileUrl == null)
            throw new InvalidOperationException("No bill uploaded for this expense.");

        return _storage.GenerateSasUrl(fileUrl);
    }

    public async Task<string> GetDocumentUrlAsync(Guid id, Guid documentId)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var document = await _db.RequestDocuments
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == documentId && x.ExpenseRequestId == id && x.OrganizationId == orgId)
            ?? throw new KeyNotFoundException("Document not found");

        return _storage.GenerateSasUrl(document.FileUrl);
    }

    public async Task RemoveDocumentAsync(Guid expenseId, Guid documentId)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var currentEmp = await _tenant.GetCurrentEmployeeAsync();

        var expense = await _db.ExpenseRequests
            .Include(x => x.Documents)
            .FirstOrDefaultAsync(x => x.Id == expenseId && x.OrganizationId == orgId)
            ?? throw new KeyNotFoundException("Expense not found");

        if (expense.SubmittedByEmployeeId != currentEmp.Id && currentEmp.Role != UserRole.Admin)
            throw new UnauthorizedAccessException("Only the submitter or an admin can remove documents.");

        if (expense.Status == ExpenseStatus.Rejected || expense.Status == ExpenseStatus.Completed || expense.Status == ExpenseStatus.Cancelled)
            throw new InvalidOperationException($"Documents cannot be removed when expense is in '{expense.Status}' status.");

        var document = expense.Documents.FirstOrDefault(x => x.Id == documentId)
            ?? throw new KeyNotFoundException("Document not found");

        if (expense.Documents.Count <= 1)
            throw new InvalidOperationException("Cannot remove the last document. At least one bill attachment is required.");

        try { await _storage.DeleteAsync(document.FileUrl); } catch { /* best-effort blob delete */ }

        _db.RequestDocuments.Remove(document);
        var remaining = expense.Documents.Where(x => x.Id != documentId).OrderBy(x => x.CreatedAt).ToList();
        expense.BillImageUrl = remaining.LastOrDefault()?.FileUrl ?? null;
        expense.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
    }

    private static ExpenseDto MapToDto(ExpenseRequest e) => new(
        e.Id,
        e.ExpenseCode,
        e.EmployeeId,
        e.Employee.FullName,
        e.Employee.Department ?? "",
        e.Amount,
        e.PaidAmount,
        e.Purpose, 
        e.BillDate, 
        e.Status.ToString(),
        e.BillImageUrl,
        e.PaymentReference,
        e.CreatedAt,
        e.Comments
            .OrderBy(c => c.CreatedAt)
            .Select(c => new CommentDto(
                c.Id,
                c.CommentByEmployee.FullName,
                c.Text,
                c.ActionType.ToString(),
                c.CreatedAt
            ))
            .ToList(),
        e.Documents
            .OrderBy(x => x.CreatedAt)
            .Select(x => new DocumentDto(
                x.Id,
                x.FileName,
                x.ContentType,
                x.FileSizeBytes,
                x.CreatedAt
            ))
            .ToList()
    );

    private async Task<List<RequestDocument>> UploadExpenseDocumentsAsync(Guid orgId, Guid expenseId, Guid uploadedByEmployeeId, IReadOnlyCollection<IFormFile> files)
    {
        var documents = new List<RequestDocument>(files.Count);
        foreach (var file in files)
        {
            var fileUrl = await _storage.UploadAsync(StorageFolders.ExpenseBill, expenseId, file);
            documents.Add(new RequestDocument
            {
                Id = Guid.NewGuid(),
                OrganizationId = orgId,
                ExpenseRequestId = expenseId,
                UploadedByEmployeeId = uploadedByEmployeeId,
                FileName = file.FileName,
                ContentType = file.ContentType,
                FileSizeBytes = file.Length,
                FileUrl = fileUrl,
                CreatedAt = DateTime.UtcNow
            });
        }

        return documents;
    }

    private static List<IFormFile> ResolveUploadedFiles(IEnumerable<IFormFile>? files, IFormFile? legacyFile)
    {
        var resolved = files?
            .Where(x => x != null && x.Length > 0)
            .ToList() ?? new List<IFormFile>();

        if (legacyFile != null && legacyFile.Length > 0 && !resolved.Contains(legacyFile))
            resolved.Add(legacyFile);

        return resolved;
    }

    private static bool HasExpenseDocument(ExpenseRequest expense) =>
        expense.Documents.Count > 0 || !string.IsNullOrWhiteSpace(expense.BillImageUrl);

    private static string GetFileNameFromUrl(string fileUrl)
    {
        if (Uri.TryCreate(fileUrl, UriKind.Absolute, out var uri))
            return Path.GetFileName(uri.LocalPath);

        return Path.GetFileName(fileUrl);
    }
}