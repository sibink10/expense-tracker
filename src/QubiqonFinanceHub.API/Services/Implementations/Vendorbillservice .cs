using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Client.Extensions.Msal;
using QubiqonFinanceHub.API.Data;
using QubiqonFinanceHub.API.DTOs;
using QubiqonFinanceHub.API.Models.Constants;
using QubiqonFinanceHub.API.Models.Entities;
using QubiqonFinanceHub.API.Models.Enums;
using QubiqonFinanceHub.API.Services.Interfaces;

namespace QubiqonFinanceHub.API.Services.Implementations;

public class VendorBillService : IVendorBillService
{
    private readonly FinanceHubDbContext _db;
    private readonly ITenantService _tenant;
    private readonly ICodeGeneratorService _codeGen;
    private readonly IEmailService _email;
    private readonly ILogger<VendorBillService> _log;
    private readonly IStorageService _storage;

    public VendorBillService(FinanceHubDbContext db, ITenantService tenant, ICodeGeneratorService codeGen, IEmailService email, ILogger<VendorBillService> log, IStorageService storage)
    { _db = db; _tenant = tenant; _codeGen = codeGen; _email = email; _log = log; _storage = storage; }

    public async Task<BillDto> CreateAsync(CreateBillRequest dto)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var emp = await _tenant.GetCurrentEmployeeAsync();
        var code = await _codeGen.GenerateBillNumberAsync(orgId, "bill");
        var vendor = await _db.Vendors.FindAsync(dto.VendorId)
            ?? throw new KeyNotFoundException("Vendor not found");

        decimal tdsAmount = 0;
        if (dto.TaxConfigId.HasValue)
        {
            var tax = await _db.TaxConfigurations.FindAsync(dto.TaxConfigId.Value);
            if (tax != null) tdsAmount = Math.Round(dto.Amount * tax.Rate / 100, 2);
        }

        var billId = Guid.NewGuid();
        var uploadedAttachments = ResolveUploadedFiles(dto.Attachments, dto.Attachment);
        var documents = await UploadBillDocumentsAsync(orgId, billId, emp.Id, uploadedAttachments);
        var attachmentUrl = documents.LastOrDefault()?.FileUrl;

        var bill = new VendorBill
        {
            Id = billId,
            OrganizationId = orgId,
            BillCode = code,
            VendorId = dto.VendorId,
            Amount = dto.Amount,
            vendorBillNumber=dto.vendorBillNumber,
            TaxConfigId = dto.TaxConfigId,
            TDSAmount = tdsAmount,
            TotalPayable = dto.Amount - tdsAmount,
            Description = dto.Description,
            BillDate = dto.BillDate,
            DueDate = dto.DueDate,
            PaymentTerms = dto.PaymentTerms,
            CCEmails = dto.CCEmails,
            AttachmentUrl = attachmentUrl,
            SubmittedByEmployeeId = emp.Id,
            Status = BillStatus.Submitted,
            CreatedAt = DateTime.UtcNow
        };

        foreach (var document in documents)
            bill.Documents.Add(document);

        bill.Comments.Add(new ActivityComment
        {
            Id = Guid.NewGuid(),
            VendorBillId = bill.Id,
            CommentByEmployeeId = emp.Id,
            Text = $"Bill submitted for ₹{dto.Amount:N2}." + (attachmentUrl != null ? " Attachment uploaded." : " No attachment."),
            ActionType = CommentActionType.Submitted
        });

        _db.VendorBills.Add(bill);
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
            await _email.SendNotificationAsync(
                Constants.EmailTemplateKeys.VendorBillSubmitted,
                new Dictionary<string, string>
                {
                    ["bill_id"] = bill.BillCode,
                    ["vendor_name"] = vendor.Name,
                    ["vendor_bill_number"] = bill.vendorBillNumber,
                    ["amount"] = $"₹{bill.Amount:N2}",
                    ["total_payable"] = $"₹{bill.TotalPayable:N2}",
                    ["bill_date"] = bill.BillDate.ToString("dd MMM yyyy"),
                    ["due_date"] = bill.DueDate.ToString("dd MMM yyyy"),
                    ["description"] = bill.Description,
                    ["submitted_by"] = emp.FullName,
                    ["action_date"] = DateTime.UtcNow.ToString("dd MMM yyyy hh:mm tt 'UTC'"),
                },
                string.Join(",", reviewers),
                bill.CCEmails);
        }

        _log.LogInformation("Bill {Code} created by {Employee}", code, emp.FullName);
        return (await GetByIdAsync(bill.Id))!;
    }

    public async Task<BillDto?> GetByIdAsync(Guid id)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var bill = await _db.VendorBills
            .Include(x => x.Vendor)
            .Include(x => x.TaxConfig)
            .Include(x => x.Documents)
            .Include(x => x.Comments).ThenInclude(c => c.CommentByEmployee)
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId);

        return bill == null ? null : await MapToDtoAsync(bill);
    }

    public async Task<PaginatedResult<BillDto>> ListAsync(FilterParams f)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var q = _db.VendorBills
            .Include(x => x.Vendor)
            .Include(x => x.TaxConfig)
            .Include(x => x.Documents)
            .Include(x => x.Comments).ThenInclude(c => c.CommentByEmployee)
            .Where(x => x.OrganizationId == orgId)
            .AsNoTracking();

        if (f.Status != null && Enum.TryParse<BillStatus>(f.Status, true, out var status))
            q = q.Where(x => x.Status == status);
        if (!string.IsNullOrWhiteSpace(f.Search))
        {
            var s = f.Search.ToLower();
            q = q.Where(x => x.BillCode.ToLower().Contains(s) || x.Vendor.Name.ToLower().Contains(s));
        }

        var total = await q.CountAsync();
        q = f.Desc ? q.OrderByDescending(x => x.CreatedAt) : q.OrderBy(x => x.CreatedAt);
        var items = await q.Skip((f.Page - 1) * f.PageSize).Take(f.PageSize).ToListAsync();
        var dtos = new List<BillDto>();
        foreach (var item in items) dtos.Add(await MapToDtoAsync(item));

        return new PaginatedResult<BillDto>(dtos, total, f.Page, f.PageSize);
    }

    public async Task<BillDto> ApproveAsync(Guid id, ApproveRequest dto)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var emp = await _tenant.GetCurrentEmployeeAsync();
        var bill = await _db.VendorBills
            .Include(x => x.Vendor)
            .FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId)
            ?? throw new KeyNotFoundException("Bill not found");

        if (bill.Status != BillStatus.Submitted)
            throw new InvalidOperationException($"Cannot approve bill in '{bill.Status}' status.");

        bill.Status = BillStatus.Approved;
        bill.UpdatedAt = DateTime.UtcNow;

        _db.ActivityComments.Add(new ActivityComment
        {
            Id = Guid.NewGuid(),
            VendorBillId = id,
            CommentByEmployeeId = emp.Id,
            Text = dto.Comments ?? "Approved.",
            ActionType = CommentActionType.Approved
        });

        await _db.SaveChangesAsync();

        var submittedBy = await _db.Employees.FindAsync(bill.SubmittedByEmployeeId);
        if (submittedBy != null && !string.IsNullOrWhiteSpace(submittedBy.Email))
        {
            await _email.SendNotificationAsync(
                Constants.EmailTemplateKeys.VendorBillApproved,
                new Dictionary<string, string>
                {
                    ["bill_id"] = bill.BillCode,
                    ["vendor_name"] = bill.Vendor.Name,
                    ["vendor_bill_number"] = bill.vendorBillNumber,
                    ["amount"] = $"₹{bill.Amount:N2}",
                    ["total_payable"] = $"₹{bill.TotalPayable:N2}",
                    ["bill_date"] = bill.BillDate.ToString("dd MMM yyyy"),
                    ["due_date"] = bill.DueDate.ToString("dd MMM yyyy"),
                    ["description"] = bill.Description,
                    ["actor_name"] = emp.FullName,
                    ["details_text"] = dto.Comments ?? "",
                    ["action_date"] = DateTime.UtcNow.ToString("dd MMM yyyy hh:mm tt 'UTC'"),
                },
                submittedBy.Email,
                bill.CCEmails);
        }

        return (await GetByIdAsync(id))!;
    }

    public async Task<BillDto> RejectAsync(Guid id, RejectRequest dto)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var emp = await _tenant.GetCurrentEmployeeAsync();
        var bill = await _db.VendorBills
            .Include(x => x.Vendor)
            .FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId)
            ?? throw new KeyNotFoundException("Bill not found");

        bill.Status = BillStatus.Rejected;
        bill.UpdatedAt = DateTime.UtcNow;

        _db.ActivityComments.Add(new ActivityComment
        {
            Id = Guid.NewGuid(),
            VendorBillId = id,
            CommentByEmployeeId = emp.Id,
            Text = dto.Comments,
            ActionType = CommentActionType.Rejected
        });

        await _db.SaveChangesAsync();

        var submittedBy = await _db.Employees.FindAsync(bill.SubmittedByEmployeeId);
        if (submittedBy != null && !string.IsNullOrWhiteSpace(submittedBy.Email))
        {
            await _email.SendNotificationAsync(
                Constants.EmailTemplateKeys.VendorBillRejected,
                new Dictionary<string, string>
                {
                    ["bill_id"] = bill.BillCode,
                    ["vendor_name"] = bill.Vendor.Name,
                    ["vendor_bill_number"] = bill.vendorBillNumber,
                    ["amount"] = $"₹{bill.Amount:N2}",
                    ["total_payable"] = $"₹{bill.TotalPayable:N2}",
                    ["bill_date"] = bill.BillDate.ToString("dd MMM yyyy"),
                    ["due_date"] = bill.DueDate.ToString("dd MMM yyyy"),
                    ["description"] = bill.Description,
                    ["actor_name"] = emp.FullName,
                    ["details_text"] = dto.Comments,
                    ["action_date"] = DateTime.UtcNow.ToString("dd MMM yyyy hh:mm tt 'UTC'"),
                },
                submittedBy.Email,
                bill.CCEmails);
        }

        return (await GetByIdAsync(id))!;
    }

    public async Task<BillDto> ProcessPaymentAsync(Guid id, ProcessPaymentRequest dto)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var emp = await _tenant.GetCurrentEmployeeAsync();
        var bill = await _db.VendorBills
            .Include(x => x.Vendor)
            .FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId)
            ?? throw new KeyNotFoundException("Bill not found");

        if (bill.Status != BillStatus.Approved)
            throw new InvalidOperationException("Bill must be approved before payment.");

        bill.Status = BillStatus.Paid;
        bill.PaymentReference = dto.PaymentReference;
        bill.PaidAt = DateTime.UtcNow;
        bill.UpdatedAt = DateTime.UtcNow;

        _db.ActivityComments.Add(new ActivityComment
        {
            Id = Guid.NewGuid(),
            VendorBillId = id,
            CommentByEmployeeId = emp.Id,
            Text = $"Payment processed. Ref: {dto.PaymentReference}",
            ActionType = CommentActionType.PaymentProcessed
        });

        await _db.SaveChangesAsync();

        var submittedBy = await _db.Employees.FindAsync(bill.SubmittedByEmployeeId);
        if (submittedBy != null && !string.IsNullOrWhiteSpace(submittedBy.Email))
        {
            await _email.SendNotificationAsync(
                Constants.EmailTemplateKeys.VendorBillPaid,
                new Dictionary<string, string>
                {
                    ["bill_id"] = bill.BillCode,
                    ["vendor_name"] = bill.Vendor.Name,
                    ["vendor_bill_number"] = bill.vendorBillNumber,
                    ["amount"] = $"₹{bill.Amount:N2}",
                    ["total_payable"] = $"₹{bill.TotalPayable:N2}",
                    ["bill_date"] = bill.BillDate.ToString("dd MMM yyyy"),
                    ["due_date"] = bill.DueDate.ToString("dd MMM yyyy"),
                    ["description"] = bill.Description,
                    ["actor_name"] = emp.FullName,
                    ["details_text"] = dto.Notes ?? "",
                    ["payment_reference"] = dto.PaymentReference,
                    ["action_date"] = DateTime.UtcNow.ToString("dd MMM yyyy hh:mm tt 'UTC'"),
                },
                submittedBy.Email,
                bill.CCEmails);
        }

        return (await GetByIdAsync(id))!;
    }

    private async Task<BillDto> MapToDtoAsync(VendorBill b)
    {
        var submittedBy = await _db.Employees.FindAsync(b.SubmittedByEmployeeId);
        return new BillDto(
            b.Id, b.BillCode, b.VendorId, b.Vendor.Name, b.vendorBillNumber, b.Vendor.GSTIN, b.Vendor.Email,
            b.Amount, b.TaxConfig?.Name, b.TDSAmount, b.TotalPayable,
            b.Description, b.BillDate, b.DueDate, b.PaymentTerms,
            b.Status.ToString(), b.AttachmentUrl, b.PaymentReference, b.PaidAt,
            submittedBy?.FullName ?? "Unknown", b.CreatedAt,
            b.Comments.OrderBy(c => c.CreatedAt).Select(c => new CommentDto(
                c.Id, c.CommentByEmployee.FullName, c.Text, c.ActionType.ToString(), c.CreatedAt
            )).ToList(),
            b.Documents
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
    }

    public async Task<string> GetAttachmentUrlAsync(Guid id)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var bill = await _db.VendorBills
            .Include(x => x.Documents)
            .FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId)
            ?? throw new KeyNotFoundException("Bill not found");

        var fileUrl = bill.Documents
            .OrderBy(x => x.CreatedAt)
            .LastOrDefault()?.FileUrl ?? bill.AttachmentUrl;

        if (fileUrl == null)
            throw new InvalidOperationException("No attachment uploaded for this bill.");

        return _storage.GenerateSasUrl(fileUrl);
    }

    public async Task<string> GetDocumentUrlAsync(Guid id, Guid documentId)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var document = await _db.RequestDocuments
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == documentId && x.VendorBillId == id && x.OrganizationId == orgId)
            ?? throw new KeyNotFoundException("Document not found");

        return _storage.GenerateSasUrl(document.FileUrl);
    }

    private async Task<List<RequestDocument>> UploadBillDocumentsAsync(Guid orgId, Guid billId, Guid uploadedByEmployeeId, IReadOnlyCollection<IFormFile> files)
    {
        var documents = new List<RequestDocument>(files.Count);
        foreach (var file in files)
        {
            var fileUrl = await _storage.UploadAsync(StorageFolders.InvoiceDoc, billId, file);
            documents.Add(new RequestDocument
            {
                Id = Guid.NewGuid(),
                OrganizationId = orgId,
                VendorBillId = billId,
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
}