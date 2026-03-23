using System.Net;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Client.Extensions.Msal;
using QubiqonFinanceHub.API.Data;
using QubiqonFinanceHub.API.DTOs;
using QubiqonFinanceHub.API.Models.Constants;
using QubiqonFinanceHub.API.Models.Entities;
using QubiqonFinanceHub.API.Models.Enums;
using QubiqonFinanceHub.API.Services.Helpers;
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
            Description = dto.Description?.Trim() ?? "",
            BillDate = dto.BillDate,
            DueDate = dto.DueDate,
            PaymentTerms = dto.PaymentTerms,
            CCEmails = dto.CCEmails,
            DiscountPercent = dto.DiscountPercent,
            Rounding = dto.Rounding,
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

        var lineItems = ParseLineItems(dto.Items);
        var validLineItems = lineItems.Where(li => !string.IsNullOrWhiteSpace(li.Description) && li.Quantity > 0).ToList();
        if (validLineItems.Count == 0)
            throw new InvalidOperationException("At least one item with description and quantity is required.");

        for (var i = 0; i < lineItems.Count; i++)
        {
            var li = lineItems[i];
            if (string.IsNullOrWhiteSpace(li.Description) || li.Quantity <= 0) continue;
            var lineAmt = li.Quantity * li.Rate;
            decimal taxAmt = 0;
            if (li.GSTConfigId.HasValue)
            {
                var gst = await _db.TaxConfigurations.FindAsync(li.GSTConfigId.Value);
                if (gst != null) taxAmt = Math.Round(lineAmt * gst.Rate / 100, 2);
            }
            bill.LineItems.Add(new VendorBillLineItem
            {
                Id = Guid.NewGuid(),
                VendorBillId = bill.Id,
                LineNumber = i + 1,
                Description = li.Description.Trim(),
                Account = li.Account?.Trim(),
                Quantity = li.Quantity,
                Rate = li.Rate,
                GSTConfigId = li.GSTConfigId,
                Amount = lineAmt + taxAmt
            });
        }

        _db.VendorBills.Add(bill);
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
            var lineItemsHtml = BuildLineItemsHtml(bill);
            var variables = new Dictionary<string, string>
            {
                ["link_type"] = "approve",
                ["entity_type"] = "bill",
                ["entity_api_id"] = bill.Id.ToString(),
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
                ["discount_percent"] = bill.DiscountPercent > 0 ? $"{bill.DiscountPercent:N1}%" : "—",
                ["rounding"] = bill.Rounding != 0 ? $"₹{bill.Rounding:N2}" : "—",
                ["line_items_html"] = lineItemsHtml,
            };
            await AppendBillEmailTaxVariablesAsync(bill.Id, variables);
            await _email.SendNotificationAsync(
                Constants.EmailTemplateKeys.VendorBillSubmitted,
                variables,
                string.Join(",", reviewers),
                bill.CCEmails);
        }

        _log.LogInformation("Bill {Code} created by {Employee}", code, emp.FullName);
        return (await GetByIdAsync(bill.Id))!;
    }

    public async Task<BillDto> UpdateAsync(Guid id, UpdateBillRequest dto)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();

        var bill = await _db.VendorBills
            .Include(x => x.TaxConfig) // ✅ keep only what you need
            .FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId)
            ?? throw new KeyNotFoundException("Bill not found");

        if (bill.Status == BillStatus.Paid)
            throw new InvalidOperationException("Paid bills cannot be edited.");

        var lineItems = ParseLineItems(dto.Items);
        var validLineItems = lineItems
            .Where(li => !string.IsNullOrWhiteSpace(li.Description) && li.Quantity > 0)
            .ToList();

        if (validLineItems.Count == 0)
            throw new InvalidOperationException("At least one item with description and quantity is required.");

        // ✅ Update bill fields
        bill.vendorBillNumber = dto.vendorBillNumber?.Trim() ?? bill.vendorBillNumber;
        bill.BillDate = dto.BillDate;
        bill.DueDate = dto.DueDate;
        bill.PaymentTerms = dto.PaymentTerms ?? bill.PaymentTerms;
        bill.TaxConfigId = dto.TaxConfigId;
        bill.CCEmails = string.IsNullOrWhiteSpace(dto.CCEmails) ? null : dto.CCEmails.Trim();
        bill.Amount = dto.Amount;
        bill.Description = dto.Description?.Trim() ?? "";
        bill.DiscountPercent = dto.DiscountPercent;
        bill.Rounding = dto.Rounding;

        // ✅ Tax calculation
        decimal tdsAmount = 0;
        if (bill.TaxConfigId.HasValue)
        {
            var tax = await _db.TaxConfigurations.FindAsync(bill.TaxConfigId.Value);
            if (tax != null)
                tdsAmount = Math.Round(dto.Amount * tax.Rate / 100, 2);
        }

        bill.TDSAmount = tdsAmount;
        bill.TotalPayable = dto.Amount - tdsAmount;

        if (bill.PaidAmount > bill.TotalPayable)
            throw new InvalidOperationException("Updated bill total cannot be less than amount already paid.");

        // 🔥 IMPORTANT FIX STARTS HERE

        // ✅ Remove existing line items WITHOUT loading navigation
        var existingItems = _db.VendorBillLineItems
            .Where(x => x.VendorBillId == bill.Id);

        _db.VendorBillLineItems.RemoveRange(existingItems);

        // ✅ Prepare new items
        var newLineItems = new List<VendorBillLineItem>();

        for (var i = 0; i < lineItems.Count; i++)
        {
            var li = lineItems[i];
            if (string.IsNullOrWhiteSpace(li.Description) || li.Quantity <= 0)
                continue;

            var lineAmt = li.Quantity * li.Rate;

            decimal taxAmt = 0;
            if (li.GSTConfigId.HasValue)
            {
                var gst = await _db.TaxConfigurations.FindAsync(li.GSTConfigId.Value);
                if (gst != null)
                    taxAmt = Math.Round(lineAmt * gst.Rate / 100, 2);
            }

            newLineItems.Add(new VendorBillLineItem
            {
                Id = Guid.NewGuid(),
                VendorBillId = bill.Id,
                LineNumber = i + 1,
                Description = li.Description.Trim(),
                Account = li.Account?.Trim(),
                Quantity = li.Quantity,
                Rate = li.Rate,
                GSTConfigId = li.GSTConfigId,
                Amount = lineAmt + taxAmt
            });
        }

        // ✅ Add explicitly via DbSet
        await _db.VendorBillLineItems.AddRangeAsync(newLineItems);

        // 🔥 FIX ENDS HERE

        bill.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return (await GetByIdAsync(id))!;
    }

    public async Task<BillDto> UploadBillAsync(Guid id, UploadVendorBillRequest dto)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var emp = await _tenant.GetCurrentEmployeeAsync();

        var bill = await _db.VendorBills
            .Include(x => x.Documents)
            .FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId)
            ?? throw new KeyNotFoundException("Bill not found");

        if (bill.Status != BillStatus.Submitted)
            throw new InvalidOperationException($"Documents can only be uploaded when bill is in '{BillStatus.Submitted}' status.");

        var uploadedFiles = ResolveUploadedFiles(dto.Attachments, dto.Attachment);
        if (uploadedFiles.Count == 0)
            throw new InvalidOperationException("At least one document is required.");

        var documents = await UploadBillDocumentsAsync(orgId, bill.Id, emp.Id, uploadedFiles);
        _db.RequestDocuments.AddRange(documents);

        var newAttachmentUrl = documents.OrderBy(x => x.CreatedAt).LastOrDefault()?.FileUrl ?? bill.AttachmentUrl;
        bill.AttachmentUrl = newAttachmentUrl;
        bill.UpdatedAt = DateTime.UtcNow;

        _db.ActivityComments.Add(new ActivityComment
        {
            Id = Guid.NewGuid(),
            VendorBillId = id,
            CommentByEmployeeId = emp.Id,
            Text = "Additional document(s) uploaded.",
            ActionType = CommentActionType.Submitted
        });

        await _db.SaveChangesAsync();
        return (await GetByIdAsync(id))!;
    }

    public async Task<BillDto?> GetByIdAsync(Guid id)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var bill = await _db.VendorBills
            .Include(x => x.Vendor)
            .Include(x => x.TaxConfig)
            .Include(x => x.Documents)
            .Include(x => x.LineItems).ThenInclude(l => l.GSTConfig)
            .Include(x => x.Comments).ThenInclude(c => c.CommentByEmployee)
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId);

        return bill == null ? null : await MapToDtoAsync(bill);
    }

    public async Task<PaginatedResult<BillDto>> ListAsync(FilterParams f)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var today = DateTime.UtcNow.Date;
        var q = _db.VendorBills
            .Include(x => x.Vendor)
            .Include(x => x.TaxConfig)
            .Include(x => x.Documents)
            .Include(x => x.LineItems).ThenInclude(l => l.GSTConfig)
            .Include(x => x.Comments).ThenInclude(c => c.CommentByEmployee)
            .Where(x => x.OrganizationId == orgId)
            .AsNoTracking();

        if (f.Status != null && Enum.TryParse<BillStatus>(f.Status, true, out var status))
        {
            if (status == BillStatus.Overdue)
            {
                q = q.Where(x => x.DueDate < today && x.PaidAmount < x.TotalPayable && x.Status != BillStatus.Paid);
            }
            else
            {
                q = q.Where(x =>
                    x.Status == status &&
                    !(x.DueDate < today && x.PaidAmount < x.TotalPayable && x.Status != BillStatus.Paid));
            }
        }
        if (!string.IsNullOrWhiteSpace(f.Search))
        {
            var s = f.Search.ToLower();
            q = q.Where(x => x.BillCode.ToLower().Contains(s) || x.Vendor.Name.ToLower().Contains(s));
        }

        var total = await q.CountAsync();
        q = q.ApplyVendorBillSorting(f);
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

        if (bill.Status == BillStatus.Approved ||
            bill.Status == BillStatus.Paid ||
            bill.Status == BillStatus.PartiallyPaid)
            throw new InvalidOperationException("Bill is already approved.");

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
            var variables = new Dictionary<string, string>
            {
                ["link_type"] = "pay",
                ["entity_type"] = "bill",
                ["entity_api_id"] = bill.Id.ToString(),
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
            };
            await AppendBillEmailTaxVariablesAsync(bill.Id, variables);
            await _email.SendNotificationAsync(
                Constants.EmailTemplateKeys.VendorBillApproved,
                variables,
                string.Join(",", financeEmails),
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

        if (bill.Status == BillStatus.Rejected)
            throw new InvalidOperationException("Bill is already rejected.");

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
            var rejectVars = new Dictionary<string, string>
            {
                ["link_type"] = "detail",
                ["entity_type"] = "bill",
                ["entity_api_id"] = bill.Id.ToString(),
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
            };
            await AppendBillEmailTaxVariablesAsync(bill.Id, rejectVars);
            await _email.SendNotificationAsync(
                Constants.EmailTemplateKeys.VendorBillRejected,
                rejectVars,
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

        if (bill.Status != BillStatus.Approved && bill.Status != BillStatus.PartiallyPaid)
            throw new InvalidOperationException("Bill must be approved before payment.");

        var remainingBefore = bill.TotalPayable - bill.PaidAmount;
        var paidAmount = dto.PaidAmount > 0 ? dto.PaidAmount : bill.TotalPayable;
        if (paidAmount > remainingBefore)
            throw new InvalidOperationException($"Paid amount (₹{paidAmount:N2}) cannot exceed the remaining balance (₹{remainingBefore:N2}).");
        bill.PaidAmount += paidAmount;
        bill.PaymentReference = dto.PaymentReference;
        bill.PaidAt = DateTime.UtcNow;
        bill.UpdatedAt = DateTime.UtcNow;
        bill.Status = bill.PaidAmount >= bill.TotalPayable ? BillStatus.Paid : BillStatus.PartiallyPaid;
        var balanceDueAfter = Math.Max(0, bill.TotalPayable - bill.PaidAmount);

        _db.ActivityComments.Add(new ActivityComment
        {
            Id = Guid.NewGuid(),
            VendorBillId = id,
            CommentByEmployeeId = emp.Id,
            Text = $"Payment processed. Amount: ₹{paidAmount:N2}. Ref: {dto.PaymentReference}",
            ActionType = CommentActionType.PaymentProcessed
        });

        await _db.SaveChangesAsync();

        var vendorEmail = bill.Vendor?.Email;
        if (!string.IsNullOrWhiteSpace(vendorEmail))
        {
            var ccSettings = await _db.OrganizationSettings
                .Where(s => s.OrganizationId == orgId && s.Key == "ccEmails")
                .Select(s => s.Value)
                .FirstOrDefaultAsync();
            var ccEmails = ccSettings?.Trim();

            var displayBillNumber = !string.IsNullOrWhiteSpace(bill.vendorBillNumber) ? bill.vendorBillNumber : bill.BillCode;
            var paidVars = new Dictionary<string, string>
            {
                ["link_type"] = "detail",
                ["entity_type"] = "bill",
                ["entity_api_id"] = bill.Id.ToString(),
                ["bill_id"] = displayBillNumber,
                ["vendor_name"] = bill.Vendor.Name,
                ["vendor_bill_number"] = bill.vendorBillNumber ?? "",
                ["amount"] = $"₹{bill.Amount:N2}",
                ["total_payable"] = $"₹{bill.TotalPayable:N2}",
                ["paid_amount"] = $"₹{bill.PaidAmount:N2}",
                ["balance_due"] = $"₹{balanceDueAfter:N2}",
                ["bill_date"] = bill.BillDate.ToString("dd MMM yyyy"),
                ["due_date"] = bill.DueDate.ToString("dd MMM yyyy"),
                ["description"] = bill.Description,
                ["actor_name"] = emp.FullName,
                ["details_text"] = dto.Notes ?? "",
                ["payment_reference"] = dto.PaymentReference,
                ["action_date"] = DateTime.UtcNow.ToString("dd MMM yyyy hh:mm tt 'UTC'"),
            };
            await AppendBillEmailTaxVariablesAsync(bill.Id, paidVars);
            await _email.SendNotificationAsync(
                Constants.EmailTemplateKeys.VendorBillPaid,
                paidVars,
                vendorEmail,
                string.IsNullOrWhiteSpace(ccEmails) ? null : ccEmails);
        }

        return (await GetByIdAsync(id))!;
    }

    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNameCaseInsensitive = true };

    /// <summary>Adds sub total, per-line GST rows, total GST, and TDS row HTML for vendor bill notification emails.</summary>
    private async Task AppendBillEmailTaxVariablesAsync(Guid billId, Dictionary<string, string> variables)
    {
        var bill = await _db.VendorBills
            .AsNoTracking()
            .Include(x => x.LineItems)
            .ThenInclude(l => l.GSTConfig)
            .Include(x => x.TaxConfig)
            .FirstOrDefaultAsync(x => x.Id == billId);

        if (bill == null)
        {
            variables["sub_total"] = "—";
            variables["total_line_gst"] = "—";
            variables["gst_breakdown_rows_html"] = string.Empty;
            variables["tds_row_html"] = string.Empty;
            return;
        }

        var items = bill.LineItems?.OrderBy(l => l.LineNumber).ToList() ?? new List<VendorBillLineItem>();
        if (items.Count == 0)
        {
            variables["sub_total"] = "—";
            variables["total_line_gst"] = "—";
            variables["gst_breakdown_rows_html"] = string.Empty;
            variables["tds_row_html"] = BuildBillTdsRowHtml(bill);
            return;
        }

        decimal subEx = 0;
        decimal totalGst = 0;
        var gstRows = new StringBuilder();
        for (var i = 0; i < items.Count; i++)
        {
            var l = items[i];
            var baseAmt = l.Quantity * l.Rate;
            subEx += baseAmt;
            var gstPart = l.Amount - baseAmt;
            if (gstPart <= 0.009m) continue;
            totalGst += gstPart;
            var tc = l.GSTConfig;
            string label = tc != null
                ? $"{WebUtility.HtmlEncode(tc.Name)} ({tc.Rate:N2}%)"
                : "Tax";
            var desc = l.Description?.Trim();
            if (!string.IsNullOrEmpty(desc))
            {
                var shortDesc = desc.Length > 45 ? desc[..45] + "…" : desc;
                label += $" · {WebUtility.HtmlEncode(shortDesc)}";
            }
            else
                label += $" · #{i + 1}";
            gstRows.Append($"""
                <tr>
                    <td style="padding:10px 16px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:13px;font-weight:500;color:#475569;">{label}</td>
                    <td style="padding:10px 16px;border-top:1px solid #e2e8f0;font-size:14px;text-align:right;color:#0f172a;">₹{gstPart:N2}</td>
                </tr>
                """);
        }

        variables["sub_total"] = $"₹{subEx:N2}";
        variables["total_line_gst"] = totalGst > 0 ? $"₹{totalGst:N2}" : "—";
        variables["gst_breakdown_rows_html"] = gstRows.ToString();
        variables["tds_row_html"] = BuildBillTdsRowHtml(bill);
    }

    private static string BuildBillTdsRowHtml(VendorBill bill)
    {
        if (bill.TDSAmount <= 0) return string.Empty;
        var t = bill.TaxConfig;
        var rawLabel = t == null
            ? "TDS"
            : string.IsNullOrWhiteSpace(t.Section)
                ? $"{t.Name} ({t.Rate:N2}%)"
                : $"{t.Name} ({t.Rate:N2}%) — {t.Section}";
        var tdsLabel = WebUtility.HtmlEncode(rawLabel);
        return $"""
            <tr>
                <td style="padding:14px 16px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:13px;font-weight:600;color:#475569;">{tdsLabel}</td>
                <td style="padding:14px 16px;border-top:1px solid #e2e8f0;font-size:14px;color:#dc2626;text-align:right;">-₹{bill.TDSAmount:N2}</td>
            </tr>
            """;
    }

    private static string BuildLineItemsHtml(VendorBill bill)
    {
        var items = bill.LineItems?.OrderBy(l => l.LineNumber).ToList() ?? new List<VendorBillLineItem>();
        if (items.Count == 0) return string.Empty;
        var rows = string.Join("", items.Select((l, i) => $"""
            <tr>
                <td style="padding:10px 12px;border-top:1px solid #e2e8f0;font-size:13px;color:#0f172a;">{i + 1}</td>
                <td style="padding:10px 12px;border-top:1px solid #e2e8f0;font-size:13px;color:#0f172a;">{System.Net.WebUtility.HtmlEncode(l.Description)}</td>
                <td style="padding:10px 12px;border-top:1px solid #e2e8f0;font-size:13px;color:#0f172a;text-align:center;">{l.Quantity:N2}</td>
                <td style="padding:10px 12px;border-top:1px solid #e2e8f0;font-size:13px;color:#0f172a;text-align:right;">₹{l.Rate:N2}</td>
                <td style="padding:10px 12px;border-top:1px solid #e2e8f0;font-size:13px;font-weight:600;color:#0f172a;text-align:right;">₹{l.Amount:N2}</td>
            </tr>
            """));
        return $"""
            <div style="margin-top:16px;">
                <div style="font-size:12px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#475569;margin-bottom:8px;">Items</div>
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
                    <thead>
                        <tr style="background:#f8fafc;">
                            <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:600;color:#475569;">#</th>
                            <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:600;color:#475569;">Description</th>
                            <th style="padding:10px 12px;text-align:center;font-size:11px;font-weight:600;color:#475569;">Qty</th>
                            <th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:600;color:#475569;">Rate</th>
                            <th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:600;color:#475569;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>{rows}</tbody>
                </table>
            </div>
            """;
    }

    /// <summary>Same rule as invoice display: past due, still unpaid, and not fully paid.</summary>
    private static string GetDisplayBillStatus(VendorBill b)
    {
        var today = DateTime.UtcNow.Date;
        var isOverdue = b.DueDate < today && b.PaidAmount < b.TotalPayable && b.Status != BillStatus.Paid;
        return isOverdue ? BillStatus.Overdue.ToString() : b.Status.ToString();
    }

    private static List<CreateBillLineItemRequest> ParseLineItems(string? itemsJson)
    {
        if (string.IsNullOrWhiteSpace(itemsJson)) return new List<CreateBillLineItemRequest>();
        try
        {
            var list = JsonSerializer.Deserialize<List<CreateBillLineItemRequest>>(itemsJson, JsonOpts);
            return list ?? new List<CreateBillLineItemRequest>();
        }
        catch { return new List<CreateBillLineItemRequest>(); }
    }

    private async Task<BillDto> MapToDtoAsync(VendorBill b)
    {
        var submittedBy = await _db.Employees.FindAsync(b.SubmittedByEmployeeId);
        var lineItems = (b.LineItems ?? new List<VendorBillLineItem>())
            .OrderBy(l => l.LineNumber)
            .Select(l => new BillLineItemDto(
                l.LineNumber,
                l.Description,
                l.Account,
                l.Quantity,
                l.Rate,
                l.GSTConfigId,
                l.GSTConfig?.Name,
                l.GSTConfig?.Rate,
                l.Amount
            ))
            .ToList();
        return new BillDto(
            b.Id, b.BillCode, b.VendorId, b.Vendor.Name, b.vendorBillNumber, b.Vendor.GSTIN, b.Vendor.Email,
            b.Amount, b.DiscountPercent, b.Rounding, b.TaxConfig?.Name, b.TDSAmount, b.TotalPayable, b.PaidAmount,
            b.Description, b.BillDate, b.DueDate, b.PaymentTerms,
            GetDisplayBillStatus(b), b.AttachmentUrl, b.PaymentReference, b.PaidAt,
            submittedBy?.FullName ?? "Unknown", b.CreatedAt,
            lineItems,
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

    public async Task RemoveDocumentAsync(Guid billId, Guid documentId)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var currentEmp = await _tenant.GetCurrentEmployeeAsync();

        var bill = await _db.VendorBills
            .Include(x => x.Documents)
            .FirstOrDefaultAsync(x => x.Id == billId && x.OrganizationId == orgId)
            ?? throw new KeyNotFoundException("Bill not found");

        if (bill.Status != BillStatus.Submitted)
            throw new InvalidOperationException("Documents can only be removed when bill is in Submitted status.");

        if (bill.SubmittedByEmployeeId != currentEmp.Id && currentEmp.Role != UserRole.Admin)
            throw new UnauthorizedAccessException("Only the submitter or an admin can remove documents.");

        var document = bill.Documents.FirstOrDefault(x => x.Id == documentId)
            ?? throw new KeyNotFoundException("Document not found");

        if (bill.Documents.Count <= 1)
            throw new InvalidOperationException("Cannot remove the last document. At least one attachment is required.");

        try { await _storage.DeleteAsync(document.FileUrl); } catch { /* best-effort blob delete */ }

        _db.RequestDocuments.Remove(document);
        var remaining = bill.Documents.Where(x => x.Id != documentId).OrderBy(x => x.CreatedAt).ToList();
        bill.AttachmentUrl = remaining.LastOrDefault()?.FileUrl ?? null;
        bill.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
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