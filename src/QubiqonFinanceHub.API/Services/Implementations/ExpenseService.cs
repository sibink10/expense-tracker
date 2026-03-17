using Microsoft.EntityFrameworkCore;
using QubiqonFinanceHub.API.Data;
using QubiqonFinanceHub.API.DTOs;
using QubiqonFinanceHub.API.Models.Constants;
using QubiqonFinanceHub.API.Models.Entities;
using QubiqonFinanceHub.API.Models.Enums;
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

        var billImageUrl = dto.BillImage != null
            ? await _storage.UploadAsync(StorageFolders.ExpenseBill, expenseId, dto.BillImage)
            : null;

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

        var reviewRoles = new[] { UserRole.Admin, UserRole.Finance, UserRole.Approver };
        var reviewers = await _db.Employees
            .Where(e => e.OrganizationId == orgId &&
                        e.IsActive &&
                        !e.IsDelete &&
                        !string.IsNullOrWhiteSpace(e.Email) &&
                        reviewRoles.Contains(e.Role))
            .Select(e => e.Email)
            .Distinct()
            .ToListAsync();

        if (reviewers.Count > 0)
        {
            await _email.SendNotificationAsync(Constants.EmailTemplateKeys.ExpenseSubmitted,
                new Dictionary<string, string>
                {
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
        var empId = _tenant.GetCurrentEmployeeId();

        var expense = await _db.ExpenseRequests
            .FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId)
            ?? throw new KeyNotFoundException("Expense not found");

        if (expense.SubmittedByEmployeeId != empId)
            throw new UnauthorizedAccessException("Only the submitter can upload the bill.");

        if (expense.Status != ExpenseStatus.PendingApproval && expense.Status != ExpenseStatus.AwaitingBill)
            throw new InvalidOperationException("Bill can only be uploaded for pending or awaiting bill expenses.");

        if (expense.BillImageUrl != null)
            await _storage.DeleteAsync(expense.BillImageUrl);  // delete old if re-uploading

        expense.BillImageUrl = await _storage.UploadAsync(StorageFolders.ExpenseBill, expense.Id, dto.BillImage);

        expense.Status = ExpenseStatus.PendingBillApproval;
        expense.UpdatedAt = DateTime.UtcNow;

        _db.ActivityComments.Add(new ActivityComment
        {
            Id = Guid.NewGuid(),
            ExpenseRequestId = id,
            CommentByEmployeeId = empId,
            Text = "Bill uploaded. Awaiting bill approval.",
            ActionType = CommentActionType.BillUploaded
        });

        await _db.SaveChangesAsync();
        return (await GetByIdAsync(id))!;
    }

    public async Task<ExpenseDto> UpdateAsync(Guid id, UpdateExpenseRequest dto)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var empId = _tenant.GetCurrentEmployeeId();

        var expense = await _db.ExpenseRequests
            .FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId)
            ?? throw new KeyNotFoundException("Expense not found");

        if (expense.SubmittedByEmployeeId != empId)
            throw new UnauthorizedAccessException("Only the submitter can edit this expense.");

        if (expense.Status != ExpenseStatus.PendingApproval)
            throw new InvalidOperationException("Only pending expenses can be edited.");

        if (dto.BillImage != null)
        {
            if (expense.BillImageUrl != null)
                await _storage.DeleteAsync(expense.BillImageUrl);  // delete old image
            expense.BillImageUrl = await _storage.UploadAsync(StorageFolders.ExpenseBill, expense.Id, dto.BillImage);
        }

        expense.Amount = dto.Amount;
        expense.Purpose = dto.Purpose;
        expense.BillDate = dto.BillDate;
        expense.UpdatedAt = DateTime.UtcNow;

        _db.ActivityComments.Add(new ActivityComment
        {
            Id = Guid.NewGuid(),
            ExpenseRequestId = id,
            CommentByEmployeeId = empId,
            Text = $"Expense updated. Amount: ₹{dto.Amount:N2}."
        });

        await _db.SaveChangesAsync();
        return (await GetByIdAsync(id))!;
    }

    public async Task<ExpenseDto?> GetByIdAsync(Guid id)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var e = await _db.ExpenseRequests
            .Include(x => x.Employee)
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
        q = f.Desc ? q.OrderByDescending(x => x.CreatedAt) : q.OrderBy(x => x.CreatedAt);
        var items = await q.Skip((f.Page - 1) * f.PageSize).Take(f.PageSize).ToListAsync();

        return new PaginatedResult<ExpenseDto>(items.Select(MapToDto).ToList(), total, f.Page, f.PageSize);
    }

    public async Task<ExpenseDto> ApproveAsync(Guid id, ApproveRequest dto)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var emp = await _tenant.GetCurrentEmployeeAsync();
        var expense = await _db.ExpenseRequests.Include(x => x.Employee)
            .FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId)
            ?? throw new KeyNotFoundException("Expense not found");

        if (expense.Status != ExpenseStatus.PendingApproval && expense.Status != ExpenseStatus.PendingBillApproval)
            throw new InvalidOperationException($"Cannot approve expense in '{expense.Status}' status.");

        expense.Status = expense.BillImageUrl != null ? ExpenseStatus.Approved : ExpenseStatus.AwaitingBill;
        expense.UpdatedAt = DateTime.UtcNow;

        _db.ActivityComments.Add(new ActivityComment
        {
            Id = Guid.NewGuid(),
            ExpenseRequestId = id,
            CommentByEmployeeId = emp.Id,
            Text = dto.Comments ?? (expense.BillImageUrl != null ? "Approved." : "Approved. Awaiting bill submission."),
            ActionType = CommentActionType.Approved
        });

        await _db.SaveChangesAsync();

        var templateKey = expense.Status == ExpenseStatus.Approved
                    ? "expense_approved"
                    : "expense_awaiting_bill";

        await _email.SendNotificationAsync(
            templateKey,
            new Dictionary<string, string>
            {
                ["employee_name"] = expense.Employee.FullName,
                ["expense_id"] = expense.ExpenseCode,
                ["purpose"] = expense.Purpose,
                ["amount"] = $"₹{expense.Amount:N2}",
                ["bill_date"] = expense.BillDate.ToString("dd MMM yyyy"),
                ["status"] = expense.Status.ToString(),
                ["approver_name"] = emp.FullName,
                ["approver_comments"] = dto.Comments ?? "",
                ["action_date"] = DateTime.UtcNow.ToString("dd MMM yyyy hh:mm tt 'UTC'"),
            },
            expense.Employee.Email);


        return (await GetByIdAsync(id))!;
    }

    public async Task<ExpenseDto> RejectAsync(Guid id, RejectRequest dto)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var emp = await _tenant.GetCurrentEmployeeAsync();
        var expense = await _db.ExpenseRequests.Include(x => x.Employee)
            .FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId)
            ?? throw new KeyNotFoundException("Expense not found");

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
        var empId = _tenant.GetCurrentEmployeeId();
        var expense = await _db.ExpenseRequests
            .FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId)
            ?? throw new KeyNotFoundException("Expense not found");

        if (expense.EmployeeId != empId) throw new UnauthorizedAccessException("Only submitter can cancel.");
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
        var expense = await _db.ExpenseRequests.Include(x => x.Employee)
            .FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId)
            ?? throw new KeyNotFoundException("Expense not found");

        if (expense.Status != ExpenseStatus.Approved && expense.Status != ExpenseStatus.PendingBillApproval)
            throw new InvalidOperationException("Expense not ready for payment.");

        expense.Status = ExpenseStatus.Completed;
        expense.PaymentReference = dto.PaymentReference;
        expense.UpdatedAt = DateTime.UtcNow;

        _db.ActivityComments.Add(new ActivityComment
        {
            Id = Guid.NewGuid(),
            ExpenseRequestId = id,
            CommentByEmployeeId = emp.Id,
            Text = $"Payment released. Ref: {dto.PaymentReference}",
            ActionType = CommentActionType.PaymentProcessed
        });

        await _db.SaveChangesAsync();

        await _email.SendNotificationAsync(Constants.EmailTemplateKeys.PaymentConfirmation,
            new Dictionary<string, string>
            {
                ["employee_name"] = expense.Employee.FullName,
                ["expense_id"] = expense.ExpenseCode,
                ["purpose"] = expense.Purpose,
                ["amount"] = $"₹{expense.Amount:N2}",
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
            .FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId)
            ?? throw new KeyNotFoundException("Expense not found");

        expense.BillImageUrl = billImageUrl;
        if (expense.Status == ExpenseStatus.AwaitingBill) expense.Status = ExpenseStatus.Approved;
        expense.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
    }

    public async Task<string> GetBillUrlAsync(Guid id)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var expense = await _db.ExpenseRequests
            .FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId)
            ?? throw new KeyNotFoundException("Expense not found");

        if (expense.BillImageUrl == null)
            throw new InvalidOperationException("No bill uploaded for this expense.");

        return _storage.GenerateSasUrl(expense.BillImageUrl);
    }

    private static ExpenseDto MapToDto(ExpenseRequest e) => new(
        e.Id,
        e.ExpenseCode,
        e.EmployeeId,
        e.Employee.FullName,
        e.Employee.Department ?? "",
        e.Amount,
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
            .ToList()
    );
}