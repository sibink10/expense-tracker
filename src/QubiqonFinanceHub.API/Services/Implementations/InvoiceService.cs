using Microsoft.EntityFrameworkCore;
using QubiqonFinanceHub.API.Data;
using QubiqonFinanceHub.API.DTOs;
using QubiqonFinanceHub.API.Models.Entities;
using QubiqonFinanceHub.API.Models.Enums;
using QubiqonFinanceHub.API.Services.Helpers;
using QubiqonFinanceHub.API.Services.Interfaces;
using QubiqonFinanceHub.API.Services.Pdf;
using QubiqonFinanceHub.API.Services.Zoho;
using Humanizer;

namespace QubiqonFinanceHub.API.Services.Implementations;

public class InvoiceService : IInvoiceService
{
    private readonly FinanceHubDbContext _db;
    private readonly ITenantService _tenant;
    private readonly ICodeGeneratorService _codeGen;
    private readonly IOrganizationService _orgService;
    private readonly IInvoicePdfGenerator _pdfGenerator;
    private readonly IStorageService _storage;
    private readonly IZohoService _zoho;
    private readonly ILogger<InvoiceService> _log;

    public InvoiceService(
        FinanceHubDbContext db,
        ITenantService tenant,
        ICodeGeneratorService codeGen,
        IOrganizationService orgService,
        IInvoicePdfGenerator pdfGenerator,
        IStorageService storage,
        IZohoService zoho,
        ILogger<InvoiceService> log)
    {
        _db = db;
        _tenant = tenant;
        _codeGen = codeGen;
        _orgService = orgService;
        _pdfGenerator = pdfGenerator;
        _storage = storage;
        _zoho = zoho;
        _log = log;
    }

    public async Task<InvoiceDto> CreateAsync(CreateInvoiceRequest dto)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var emp = await _tenant.GetCurrentEmployeeAsync();
        var client = await _db.Clients.FindAsync(dto.ClientId)
            ?? throw new KeyNotFoundException("Client not found");
        if (client.OrganizationId != orgId || client.IsDelete)
            throw new KeyNotFoundException("Client not found");

        var code = await _codeGen.GenerateBillNumberAsync(orgId, "invoice", client.Country);

        var invoice = new Invoice
        {
            Id = Guid.NewGuid(),
            OrganizationId = orgId,
            InvoiceCode = code,
            ClientId = dto.ClientId,
            Currency = dto.Currency,
            InvoiceDate = dto.InvoiceDate,
            DueDate = dto.DueDate,
            PaymentTerms = dto.PaymentTerms,
            PurchaseOrder = dto.PurchaseOrder,
            Notes = dto.Notes,
            TaxConfigId = dto.TaxConfigId,
            CreatedByEmployeeId = emp.Id,
            Status = dto.SendImmediately ? InvoiceStatus.Sent : InvoiceStatus.Draft,
            SentAt = dto.SendImmediately ? DateTime.UtcNow : null,
        };

        decimal subTotal = 0, totalGst = 0;

        for (int i = 0; i < dto.LineItems.Count; i++)
        {
            var li = dto.LineItems[i];
            var lineAmt = li.Quantity * li.Rate;
            decimal gstAmt = 0;

            if (li.GSTConfigId.HasValue)
            {
                var gstConfig = await _db.TaxConfigurations.FindAsync(li.GSTConfigId.Value);
                if (gstConfig != null) gstAmt = Math.Round(lineAmt * gstConfig.Rate / 100, 2);
            }

            invoice.LineItems.Add(new InvoiceLineItem
            {
                Id = Guid.NewGuid(), InvoiceId = invoice.Id, LineNumber = i + 1,
                Description = li.Description, HSNCode = li.HSNCode,
                Quantity = li.Quantity, Rate = li.Rate, Amount = lineAmt,
                GSTConfigId = li.GSTConfigId, GSTAmount = gstAmt,
                TotalAmount = lineAmt + gstAmt
            });

            subTotal += lineAmt;
            totalGst += gstAmt;
        }

        decimal taxAmt = 0;
        if (dto.TaxConfigId.HasValue)
        {
            var taxConfig = await _db.TaxConfigurations.FindAsync(dto.TaxConfigId.Value);
            if (taxConfig != null) taxAmt = Math.Round(subTotal * taxConfig.Rate / 100, 2);
        }

        invoice.SubTotal = subTotal;
        invoice.TotalGST = totalGst;
        invoice.TaxAmount = taxAmt;
        invoice.Total = subTotal + totalGst - taxAmt;

        // Generate total in words
        var currencyName = dto.Currency switch
        {
            "USD" => "United States Dollar",
            "EUR" => "Euro",
            "GBP" => "British Pound",
            "CAD" => "Canadian Dollar",
            "AED" => "United Arab Emirates Dirham",
            _ => "Indian Rupee"
        };
        var wholeAmount = (int)Math.Floor(invoice.Total);
        invoice.TotalInWords = $"{currencyName} {wholeAmount.ToWords().Transform(To.TitleCase)}";

        if (dto.SendImmediately)
        {
            invoice.Comments.Add(new ActivityComment
            {
                Id = Guid.NewGuid(), InvoiceId = invoice.Id,
                CommentByEmployeeId = emp.Id, Text = "Invoice created and sent.",
                ActionType = CommentActionType.Sent
            });
        }

        _db.Invoices.Add(invoice);
        await _db.SaveChangesAsync();

        _log.LogInformation("Invoice {Code} created for {Client}", code, client.Name);
        return (await GetByIdAsync(invoice.Id))!;
    }

    public async Task<InvoiceDto> UpdateAsync(Guid id, UpdateInvoiceRequest dto)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();

        var inv = await _db.Invoices
            .Include(x => x.Client) // ✅ keep only what you need
            .FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId)
            ?? throw new KeyNotFoundException("Invoice not found");

        if (inv.Status != InvoiceStatus.Draft)
            throw new InvalidOperationException("Only draft invoices can be edited.");

        // ✅ Update basic fields
        inv.Currency = dto.Currency;
        inv.InvoiceDate = dto.InvoiceDate;
        inv.DueDate = dto.DueDate;
        inv.PaymentTerms = dto.PaymentTerms;
        inv.PurchaseOrder = dto.PurchaseOrder?.Trim();
        inv.Notes = dto.Notes?.Trim();
        inv.TaxConfigId = dto.TaxConfigId;
        inv.UpdatedAt = DateTime.UtcNow;

        // 🔥 FIX START

        // ✅ Remove existing items WITHOUT loading navigation
        var existingItems = _db.InvoiceLineItems
            .Where(x => x.InvoiceId == inv.Id);

        _db.InvoiceLineItems.RemoveRange(existingItems);

        decimal subTotal = 0, totalGst = 0;

        var newItems = new List<InvoiceLineItem>();

        for (int i = 0; i < dto.LineItems.Count; i++)
        {
            var li = dto.LineItems[i];

            var lineAmt = li.Quantity * li.Rate;

            decimal gstAmt = 0;
            if (li.GSTConfigId.HasValue)
            {
                var gstConfig = await _db.TaxConfigurations.FindAsync(li.GSTConfigId.Value);
                if (gstConfig != null)
                    gstAmt = Math.Round(lineAmt * gstConfig.Rate / 100, 2);
            }

            newItems.Add(new InvoiceLineItem
            {
                Id = Guid.NewGuid(),
                InvoiceId = inv.Id,
                LineNumber = i + 1,
                Description = li.Description,
                HSNCode = li.HSNCode,
                Quantity = li.Quantity,
                Rate = li.Rate,
                Amount = lineAmt,
                GSTConfigId = li.GSTConfigId,
                GSTAmount = gstAmt,
                TotalAmount = lineAmt + gstAmt
            });

            subTotal += lineAmt;
            totalGst += gstAmt;
        }

        // ✅ Add via DbSet (NOT navigation)
        await _db.InvoiceLineItems.AddRangeAsync(newItems);

        // 🔥 FIX END

        // ✅ Tax calculation
        decimal taxAmt = 0;
        if (dto.TaxConfigId.HasValue)
        {
            var taxConfig = await _db.TaxConfigurations.FindAsync(dto.TaxConfigId.Value);
            if (taxConfig != null)
                taxAmt = Math.Round(subTotal * taxConfig.Rate / 100, 2);
        }

        inv.SubTotal = subTotal;
        inv.TotalGST = totalGst;
        inv.TaxAmount = taxAmt;
        inv.Total = subTotal + totalGst - taxAmt;

        var currencyName = dto.Currency switch
        {
            "USD" => "United States Dollar",
            "EUR" => "Euro",
            "GBP" => "British Pound",
            "CAD" => "Canadian Dollar",
            "AED" => "United Arab Emirates Dirham",
            _ => "Indian Rupee"
        };

        var wholeAmount = (int)Math.Floor(inv.Total);
        inv.TotalInWords = $"{currencyName} {wholeAmount.ToWords().Transform(To.TitleCase)}";

        await _db.SaveChangesAsync();

        _log.LogInformation("Invoice {Code} updated", inv.InvoiceCode);

        return (await GetByIdAsync(id))!;
    }

    public async Task<InvoiceDto?> GetByIdAsync(Guid id)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var inv = await _db.Invoices
            .Include(x => x.Client)
            .Include(x => x.LineItems.OrderBy(l => l.LineNumber))
                .ThenInclude(l => l.GSTConfig)
            .Include(x => x.TaxConfig)
            .Include(x => x.Comments).ThenInclude(c => c.CommentByEmployee)
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId);

        if (inv == null) return null;
        return MapToDto(inv);
    }

    public async Task<PaginatedResult<InvoiceDto>> ListAsync(FilterParams f)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var today = DateTime.UtcNow.Date;
        var q = _db.Invoices
            .Include(x => x.Client)
            .Include(x => x.LineItems.OrderBy(l => l.LineNumber)).ThenInclude(l => l.GSTConfig)
            .Include(x => x.TaxConfig)
            .Include(x => x.Comments).ThenInclude(c => c.CommentByEmployee)
            .Where(x => x.OrganizationId == orgId)
            .AsNoTracking();

        if (f.Status != null && Enum.TryParse<InvoiceStatus>(f.Status, true, out var status))
        {
            if (status == InvoiceStatus.Overdue)
            {
                q = q.Where(x => x.DueDate < today && x.paidAmound < x.Total && x.Status != InvoiceStatus.Paid);
            }
            else
            {
                q = q.Where(x =>
                    x.Status == status &&
                    !(x.DueDate < today && x.paidAmound < x.Total && x.Status != InvoiceStatus.Paid));
            }
        }
        if (!string.IsNullOrWhiteSpace(f.Search))
        {
            var s = f.Search.ToLower();
            q = q.Where(x => x.InvoiceCode.ToLower().Contains(s) || x.Client.Name.ToLower().Contains(s));
        }

        var total = await q.CountAsync();
        q = q.ApplyInvoiceSorting(f);
        var items = await q.Skip((f.Page - 1) * f.PageSize).Take(f.PageSize).ToListAsync();

        return new PaginatedResult<InvoiceDto>(items.Select(MapToDto).ToList(), total, f.Page, f.PageSize);
    }

    public async Task<InvoiceStatusCountsDto> GetStatusCountsAsync()
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var today = DateTime.UtcNow.Date;

        var invoices = _db.Invoices
            .Where(x => x.OrganizationId == orgId)
            .AsNoTracking();

        var draft = await invoices.CountAsync(x =>
            x.Status == InvoiceStatus.Draft &&
            !(x.DueDate < today && x.paidAmound < x.Total));
        var sent = await invoices.CountAsync(x =>
            x.Status == InvoiceStatus.Sent &&
            !(x.DueDate < today && x.paidAmound < x.Total));
        var partiallyPaid = await invoices.CountAsync(x =>
            x.Status == InvoiceStatus.PartiallyPaid &&
            !(x.DueDate < today && x.paidAmound < x.Total));
        var paid = await invoices.CountAsync(x => x.Status == InvoiceStatus.Paid);
        var overdue = await invoices.CountAsync(x =>
            x.DueDate < today &&
            x.paidAmound < x.Total &&
            x.Status != InvoiceStatus.Paid);

        return new InvoiceStatusCountsDto(draft, sent, partiallyPaid, paid, overdue);
    }

    public async Task<InvoiceDto> MarkSentAsync(Guid id)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var emp = await _tenant.GetCurrentEmployeeAsync();
        var inv = await _db.Invoices
            .FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId)
            ?? throw new KeyNotFoundException("Invoice not found");

        if (emp.Role != UserRole.Finance && emp.Role != UserRole.Admin)
            throw new InvalidOperationException("Only Finance or Admin can send invoices to the client.");

        if (inv.Status != InvoiceStatus.Draft)
            throw new InvalidOperationException("Only draft invoices can be sent to the client.");

        inv.Status = InvoiceStatus.Sent;
        inv.SentAt = DateTime.UtcNow;
        inv.UpdatedAt = DateTime.UtcNow;

        _db.ActivityComments.Add(new ActivityComment
        {
            Id = Guid.NewGuid(), InvoiceId = id, CommentByEmployeeId = emp.Id,
            Text = "Invoice sent to client.", ActionType = CommentActionType.Sent
        });

        await _db.SaveChangesAsync();

        return (await GetByIdAsync(id))!;
    }

    public async Task<InvoiceDto> MarkPaidAsync(Guid id, ProcessPaymentRequest dto)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var emp = await _tenant.GetCurrentEmployeeAsync();
        var inv = await _db.Invoices
            .Include(x => x.Client)
            .Include(x => x.LineItems)
            .ThenInclude(l => l.GSTConfig)
            .Include(x => x.TaxConfig)
            .FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId)
            ?? throw new KeyNotFoundException("Invoice not found");

        if (inv.Status == InvoiceStatus.Paid || inv.paidAmound >= inv.Total)
            throw new InvalidOperationException("Invoice is already fully paid.");

        if (inv.Status is InvoiceStatus.Draft or InvoiceStatus.PendingSignature or InvoiceStatus.Signed or InvoiceStatus.SignatureFailed)
            throw new InvalidOperationException("Complete signing and send the invoice to the client before recording payment.");

        var currentPaid = inv.paidAmound;
        var newTotalPaid = currentPaid + dto.PaidAmount;
        if (newTotalPaid > inv.Total)
            throw new InvalidOperationException($"Paid amount cannot exceed the remaining balance (₹{inv.Total - currentPaid:N2}).");
        inv.paidAmound = newTotalPaid;
        if (newTotalPaid < inv.Total)
            inv.Status = InvoiceStatus.PartiallyPaid;
        else
            inv.Status = InvoiceStatus.Paid;
        inv.PaymentReference = string.IsNullOrWhiteSpace(dto.PaymentReference)
            ? null
            : dto.PaymentReference.Trim();
        inv.PaidAt = DateTime.UtcNow;
        inv.UpdatedAt = DateTime.UtcNow;

        var refPart = string.IsNullOrWhiteSpace(dto.PaymentReference) ? "—" : dto.PaymentReference.Trim();
        var paymentComment =
            $"Payment recorded. Amount: {FormatCurrency(dto.PaidAmount, inv.Currency)}. Ref: {refPart}";
        if (!string.IsNullOrWhiteSpace(dto.Notes))
            paymentComment += $". Notes: {dto.Notes.Trim()}";

        _db.ActivityComments.Add(new ActivityComment
        {
            Id = Guid.NewGuid(), InvoiceId = id, CommentByEmployeeId = emp.Id,
            Text = paymentComment,
            ActionType = CommentActionType.PaymentProcessed
        });

        await _db.SaveChangesAsync();

        return (await GetByIdAsync(id))!;
    }

    public Task<byte[]> GeneratePdfAsync(Guid id) => _pdfGenerator.GenerateAsync(id);

    public async Task<InvoiceDto> TransitionToPendingSignatureAsync(Guid id, string zohoRequestId, string? zohoStatus)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var emp = await _tenant.GetCurrentEmployeeAsync();
        var inv = await _db.Invoices.FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId)
            ?? throw new KeyNotFoundException("Invoice not found.");

        if (inv.Status is not (InvoiceStatus.Draft or InvoiceStatus.SignatureFailed))
            throw new InvalidOperationException("Only draft or failed invoices can be sent for signing.");

        inv.Status = InvoiceStatus.PendingSignature;
        inv.ZohoSignRequestId = zohoRequestId.Trim();
        inv.ZohoSignStatus = zohoStatus;
        inv.ZohoSignStatusUpdatedAt = DateTime.UtcNow;
        inv.SignatureRequestedAt = DateTime.UtcNow;
        inv.UpdatedAt = DateTime.UtcNow;

        _db.ActivityComments.Add(new ActivityComment
        {
            Id = Guid.NewGuid(),
            InvoiceId = id,
            CommentByEmployeeId = emp.Id,
            Text = $"Sent for Zoho Sign (request {zohoRequestId}).",
            ActionType = CommentActionType.Sent
        });

        await _db.SaveChangesAsync();
        return (await GetByIdAsync(id))!;
    }

    public async Task<InvoiceDto> ApplyZohoSignStatusAsync(Guid id, string zohoStatus)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var inv = await _db.Invoices.FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId)
            ?? throw new KeyNotFoundException("Invoice not found.");

        inv.ZohoSignStatus = zohoStatus;
        inv.ZohoSignStatusUpdatedAt = DateTime.UtcNow;

        var mapped = _zoho.MapZohoRequestStatusToInvoiceStatus(zohoStatus);
        if (mapped == nameof(InvoiceStatus.Signed) && inv.Status == InvoiceStatus.PendingSignature)
        {
            inv.Status = InvoiceStatus.Signed;
            inv.UpdatedAt = DateTime.UtcNow;
            _db.ActivityComments.Add(new ActivityComment
            {
                Id = Guid.NewGuid(),
                InvoiceId = id,
                CommentByEmployeeId = (await _tenant.GetCurrentEmployeeAsync()).Id,
                Text = "Document signed in Zoho Sign.",
                ActionType = CommentActionType.General
            });
        }
        else if (mapped == nameof(InvoiceStatus.SignatureFailed))
        {
            inv.Status = InvoiceStatus.SignatureFailed;
            inv.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();
        return (await GetByIdAsync(id))!;
    }

    public async Task<InvoiceDto> CompleteSignedPdfSyncAsync(Guid id, string blobUrl)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var emp = await _tenant.GetCurrentEmployeeAsync();
        var inv = await _db.Invoices.FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId)
            ?? throw new KeyNotFoundException("Invoice not found.");

        if (inv.Status != InvoiceStatus.Signed && inv.Status != InvoiceStatus.PendingSignature)
            throw new InvalidOperationException("Invoice is not ready for signed PDF sync.");

        inv.SignedPdfUrl = blobUrl;
        inv.SignedAt = DateTime.UtcNow;
        inv.Status = InvoiceStatus.Sent;
        inv.SentAt ??= DateTime.UtcNow;
        inv.UpdatedAt = DateTime.UtcNow;

        _db.ActivityComments.Add(new ActivityComment
        {
            Id = Guid.NewGuid(),
            InvoiceId = id,
            CommentByEmployeeId = emp.Id,
            Text = "Signed PDF stored; invoice marked as sent.",
            ActionType = CommentActionType.Sent
        });

        await _db.SaveChangesAsync();
        return (await GetByIdAsync(id))!;
    }

    public async Task<InvoiceDto> ClearZohoSignForResendAsync(Guid id)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var inv = await _db.Invoices.FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId)
            ?? throw new KeyNotFoundException("Invoice not found.");

        inv.ZohoSignRequestId = null;
        inv.ZohoSignStatus = null;
        inv.ZohoSignStatusUpdatedAt = null;
        inv.SignatureRequestedAt = null;
        inv.SignedPdfUrl = null;
        inv.SignedAt = null;
        inv.Status = InvoiceStatus.Draft;
        inv.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return (await GetByIdAsync(id))!;
    }

    public async Task<InvoiceZohoSignStatusDto> GetZohoSignStatusAsync(Guid id, bool refreshFromZoho = true)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var inv = await _db.Invoices
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId)
            ?? throw new KeyNotFoundException("Invoice not found.");

        var org = await _db.Organizations.AsNoTracking()
            .FirstOrDefaultAsync(o => o.Id == inv.OrganizationId)
            ?? throw new KeyNotFoundException("Organization not found.");

        if (refreshFromZoho && !string.IsNullOrWhiteSpace(inv.ZohoSignRequestId))
        {
            try
            {
                var detail = await _zoho.GetSignRequestByIdAsync(inv.ZohoSignRequestId);
                var zohoStatus = TryReadZohoRequestStatus(detail);
                if (!string.IsNullOrWhiteSpace(zohoStatus))
                    await ApplyZohoSignStatusAsync(id, zohoStatus);

                inv = await _db.Invoices.AsNoTracking()
                    .FirstAsync(x => x.Id == id && x.OrganizationId == orgId);
            }
            catch (Exception ex)
            {
                _log.LogWarning(ex, "Could not refresh Zoho sign status for invoice {InvoiceId}", id);
            }
        }

        var statusName = GetDisplayStatus(inv);
        var canSync = inv.Status == InvoiceStatus.Signed && string.IsNullOrWhiteSpace(inv.SignedPdfUrl);
        var canResend = inv.Status is InvoiceStatus.SignatureFailed or InvoiceStatus.Draft;

        return new InvoiceZohoSignStatusDto(
            inv.ZohoSignRequestId,
            inv.ZohoSignStatus,
            statusName,
            inv.SignedPdfUrl,
            canResend,
            canSync,
            inv.ZohoSignStatusUpdatedAt ?? DateTime.UtcNow,
            org.ZohoSignEmail
        );
    }

    public async Task<InvoiceDto> SyncSignedPdfFromZohoAsync(Guid id)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var inv = await _db.Invoices.FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId)
            ?? throw new KeyNotFoundException("Invoice not found.");

        await SyncSignedPdfCoreAsync(inv);
        return (await GetByIdAsync(id))!;
    }

    public async Task<string> GetSignedPdfUrlAsync(Guid id)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var inv = await _db.Invoices.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId)
            ?? throw new KeyNotFoundException("Invoice not found.");

        if (string.IsNullOrWhiteSpace(inv.SignedPdfUrl))
            throw new InvalidOperationException("No signed PDF is stored for this invoice.");

        return _storage.GenerateSasUrl(inv.SignedPdfUrl);
    }

    public async Task ApplyZohoSignStatusByRequestIdAsync(string zohoRequestId, string zohoStatus)
    {
        var inv = await _db.Invoices.FirstOrDefaultAsync(x => x.ZohoSignRequestId == zohoRequestId)
            ?? throw new KeyNotFoundException("Invoice not found for Zoho request.");

        inv.ZohoSignStatus = zohoStatus;
        inv.ZohoSignStatusUpdatedAt = DateTime.UtcNow;

        var mapped = _zoho.MapZohoRequestStatusToInvoiceStatus(zohoStatus);
        if (mapped == nameof(InvoiceStatus.Signed) && inv.Status == InvoiceStatus.PendingSignature)
        {
            inv.Status = InvoiceStatus.Signed;
            inv.UpdatedAt = DateTime.UtcNow;
            _db.ActivityComments.Add(new ActivityComment
            {
                Id = Guid.NewGuid(),
                InvoiceId = inv.Id,
                CommentByEmployeeId = inv.CreatedByEmployeeId,
                Text = "Document signed in Zoho Sign (webhook).",
                ActionType = CommentActionType.General
            });
        }
        else if (mapped == nameof(InvoiceStatus.SignatureFailed))
        {
            inv.Status = InvoiceStatus.SignatureFailed;
            inv.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();
    }

    public async Task TrySyncSignedPdfByRequestIdAsync(string zohoRequestId)
    {
        var inv = await _db.Invoices.FirstOrDefaultAsync(x => x.ZohoSignRequestId == zohoRequestId);
        if (inv == null) return;
        if (!string.IsNullOrWhiteSpace(inv.SignedPdfUrl)) return;
        if (inv.Status != InvoiceStatus.Signed && inv.Status != InvoiceStatus.PendingSignature) return;

        try
        {
            await SyncSignedPdfCoreAsync(inv);
        }
        catch (Exception ex)
        {
            _log.LogWarning(ex, "Auto sync signed PDF failed for Zoho request {RequestId}", zohoRequestId);
        }
    }

    private async Task SyncSignedPdfCoreAsync(Invoice inv)
    {
        if (string.IsNullOrWhiteSpace(inv.ZohoSignRequestId))
            throw new InvalidOperationException("No Zoho Sign request is linked to this invoice.");

        if (!string.IsNullOrWhiteSpace(inv.SignedPdfUrl)) return;

        var pdfBytes = await _zoho.DownloadSignRequestPdfAsync(inv.ZohoSignRequestId);
        var safeCode = SanitizeBlobFileName(inv.InvoiceCode);
        var blobPath = $"invoices/{safeCode}.pdf";
        var url = await _storage.UploadBytesAsync(blobPath, pdfBytes, "application/pdf");

        inv.SignedPdfUrl = url;
        inv.SignedAt = DateTime.UtcNow;
        inv.Status = InvoiceStatus.Sent;
        inv.SentAt ??= DateTime.UtcNow;
        inv.UpdatedAt = DateTime.UtcNow;

        _db.ActivityComments.Add(new ActivityComment
        {
            Id = Guid.NewGuid(),
            InvoiceId = inv.Id,
            CommentByEmployeeId = inv.CreatedByEmployeeId,
            Text = "Signed PDF stored; invoice marked as sent.",
            ActionType = CommentActionType.Sent
        });

        await _db.SaveChangesAsync();
    }

    private static string SanitizeBlobFileName(string code)
    {
        var invalid = Path.GetInvalidFileNameChars();
        var cleaned = new string(code.Select(c => invalid.Contains(c) ? '_' : c).ToArray());
        return string.IsNullOrWhiteSpace(cleaned) ? "invoice" : cleaned;
    }

    private static string? TryReadZohoRequestStatus(System.Text.Json.Nodes.JsonNode detail)
    {
        try
        {
            if (detail["requests"] is System.Text.Json.Nodes.JsonObject req &&
                req["request_status"] is System.Text.Json.Nodes.JsonValue v &&
                v.TryGetValue<string>(out var s))
                return s;
            if (detail["request_status"] is System.Text.Json.Nodes.JsonValue v2 &&
                v2.TryGetValue<string>(out var s2))
                return s2;
        }
        catch { /* ignore */ }
        return null;
    }

    private static string FormatCurrency(decimal amount, string currency) =>
        currency switch
        {
            "USD" => $"${amount:N2}",
            "EUR" => $"€{amount:N2}",
            "GBP" => $"£{amount:N2}",
            "CAD" => $"CA${amount:N2}",
            "AED" => $"AED {amount:N2}",
            _ => $"₹{amount:N2}"
        };

    private static InvoiceDto MapToDto(Invoice inv) => new(
     inv.Id, inv.InvoiceCode,
     inv.ClientId, inv.Client.Name, inv.Client.Email,
     inv.Client.ContactPerson, inv.Client.Country, inv.Currency,
     inv.SubTotal, inv.TotalGST, inv.TaxConfig?.Name, inv.TaxConfigId, inv.TaxAmount, inv.Total, inv.paidAmound,
     inv.InvoiceDate, inv.DueDate, inv.PaymentTerms, inv.PurchaseOrder,
     GetDisplayStatus(inv), inv.Notes, inv.TotalInWords,
     inv.PaymentReference, inv.PaidAt, inv.CreatedAt,
     inv.ZohoSignRequestId, inv.ZohoSignStatus, inv.SignatureRequestedAt, inv.SignedPdfUrl, inv.SignedAt,
     inv.LineItems.Select(l => new InvoiceLineItemDto(
         l.LineNumber, l.Description, l.HSNCode, l.Quantity, l.Rate, l.Amount,
         l.GSTConfig?.Name, l.GSTConfig?.Rate ?? 0, l.GSTAmount, l.TotalAmount, l.GSTConfigId
     )).ToList(),
     inv.Comments.OrderBy(c => c.CreatedAt).Select(c => new CommentDto(
         c.Id, c.CommentByEmployee.FullName, c.Text, c.ActionType.ToString(), c.CreatedAt
     )).ToList()
 );

    private static string GetDisplayStatus(Invoice inv)
    {
        if (inv.Status is InvoiceStatus.PendingSignature or InvoiceStatus.Signed or InvoiceStatus.SignatureFailed)
            return inv.Status.ToString();

        var today = DateTime.UtcNow.Date;
        var isOverdue = inv.DueDate < today && inv.paidAmound < inv.Total && inv.Status != InvoiceStatus.Paid;
        return isOverdue ? InvoiceStatus.Overdue.ToString() : inv.Status.ToString();
    }
}
