using System.Net;
using System.Text;
using Microsoft.EntityFrameworkCore;
using QubiqonFinanceHub.API.Data;
using QubiqonFinanceHub.API.DTOs;
using QubiqonFinanceHub.API.Models.Constants;
using QubiqonFinanceHub.API.Models.Entities;
using QubiqonFinanceHub.API.Models.Enums;
using QubiqonFinanceHub.API.Services.Helpers;
using QubiqonFinanceHub.API.Services.Interfaces;
using Humanizer;

namespace QubiqonFinanceHub.API.Services.Implementations;

public class InvoiceService : IInvoiceService
{
    private readonly FinanceHubDbContext _db;
    private readonly ITenantService _tenant;
    private readonly ICodeGeneratorService _codeGen;
    private readonly IEmailService _email;
    private readonly IOrganizationService _orgService;
    private readonly ILogger<InvoiceService> _log;

    public InvoiceService(FinanceHubDbContext db, ITenantService tenant, ICodeGeneratorService codeGen, IEmailService email, IOrganizationService orgService, ILogger<InvoiceService> log)
    { _db = db; _tenant = tenant; _codeGen = codeGen; _email = email; _orgService = orgService; _log = log; }

    public async Task<InvoiceDto> CreateAsync(CreateInvoiceRequest dto)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var emp = await _tenant.GetCurrentEmployeeAsync();
        var client = await _db.Clients.FindAsync(dto.ClientId)
            ?? throw new KeyNotFoundException("Client not found");
        if (client.OrganizationId != orgId || client.IsDelete)
            throw new KeyNotFoundException("Client not found");

        var code = await _codeGen.GenerateBillNumberAsync(orgId, "invoice");

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

        var approverEmails = await _db.Employees
            .Where(e => e.OrganizationId == orgId &&
                        e.IsActive &&
                        !e.IsDelete &&
                        !string.IsNullOrWhiteSpace(e.Email) &&
                        (e.Role == UserRole.Finance || e.Role == UserRole.Approver))
            .Select(e => e.Email)
            .Distinct()
            .ToListAsync();

        var invoiceForEmail = await _db.Invoices
            .AsNoTracking()
            .Include(x => x.Client)
            .Include(x => x.LineItems)
            .ThenInclude(l => l.GSTConfig)
            .Include(x => x.TaxConfig)
            .FirstAsync(x => x.Id == invoice.Id);

        if (approverEmails.Count > 0)
        {
            await _email.SendNotificationAsync(
                Constants.EmailTemplateKeys.InvoiceCreated,
                await BuildInvoiceEmailVariablesAsync(invoiceForEmail, invoiceForEmail.Client, emp.FullName, dto.SendImmediately ? "Sent" : "Draft", 0m, string.Empty, dto.SendImmediately ? "inv-pay" : "detail"),
                string.Join(",", approverEmails));
        }

        if (dto.SendImmediately)
        {
            await _email.SendNotificationAsync(
                Constants.EmailTemplateKeys.InvoiceSent,
                await BuildInvoiceEmailVariablesAsync(invoiceForEmail, invoiceForEmail.Client, emp.FullName, "Sent", 0m, string.Empty, "inv-pay"),
                client.Email);
        }

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
            .Include(x => x.Client)
            .Include(x => x.LineItems)
            .ThenInclude(l => l.GSTConfig)
            .Include(x => x.TaxConfig)
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

        await _email.SendNotificationAsync(
            Constants.EmailTemplateKeys.InvoiceSent,
            await BuildInvoiceEmailVariablesAsync(inv, inv.Client, emp.FullName, "Sent", inv.paidAmound, string.Empty, "inv-pay"),
            inv.Client.Email);

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

        if (inv.Status == InvoiceStatus.Draft)
            throw new InvalidOperationException("Send the invoice to the client before recording payment.");

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

        _db.ActivityComments.Add(new ActivityComment
        {
            Id = Guid.NewGuid(), InvoiceId = id, CommentByEmployeeId = emp.Id,
            Text = paymentComment,
            ActionType = CommentActionType.PaymentProcessed
        });

        await _db.SaveChangesAsync();

        return (await GetByIdAsync(id))!;
    }

    public async Task<byte[]> GeneratePdfAsync(Guid id)
    {
        var inv = await GetByIdAsync(id)
            ?? throw new KeyNotFoundException("Invoice not found");
        var org = await _orgService.GetAsync();

        // QuestPDF document generation would go here
        // For now return empty - in production this uses QuestPDF to match
        // the exact Zoho Books format with logo, bank details, etc.
        throw new NotImplementedException("PDF generation via QuestPDF — see InvoicePdfGenerator.cs");
    }

    private static string FormatCurrency(decimal amount, string currency) =>
        currency switch
        {
            "USD" => $"${amount:N2}",
            "EUR" => $"€{amount:N2}",
            "GBP" => $"£{amount:N2}",
            "CAD" => $"CA${amount:N2}",
            _ => $"₹{amount:N2}"
        };

    private static string GetInvoiceStatusLabel(InvoiceStatus status) =>
        status switch
        {
            InvoiceStatus.PartiallyPaid => "Partially Paid",
            _ => status.ToString()
        };

    private async Task<Dictionary<string, string>> BuildInvoiceEmailVariablesAsync(
        Invoice invoice,
        Client client,
        string actorName,
        string statusLabel,
        decimal paymentAmountShownInEmail,
        string detailsText,
        string? linkType = null)
    {
        var totalPaidCumulative = invoice.paidAmound;
        var balanceDue = Math.Max(invoice.Total - totalPaidCumulative, 0);

        var dict = new Dictionary<string, string>
        {
            ["entity_type"] = "invoice",
            ["entity_api_id"] = invoice.Id.ToString(),
            ["invoice_number"] = invoice.InvoiceCode,
            ["invoice_date"] = invoice.InvoiceDate.ToString("dd/MM/yyyy"),
            ["due_date"] = invoice.DueDate.ToString("dd/MM/yyyy"),
            ["payment_terms"] = string.IsNullOrWhiteSpace(invoice.PaymentTerms) ? "NA" : invoice.PaymentTerms,
            ["purchase_order"] = string.IsNullOrWhiteSpace(invoice.PurchaseOrder) ? "NA" : invoice.PurchaseOrder,
            ["client_name"] = client.Name,
            ["client_email"] = client.Email,
            ["client_billing_address"] = client.BillingAddress ?? client.Address ?? "",
            ["client_shipping_address"] = client.ShippingAddress ?? client.BillingAddress ?? client.Address ?? "",
            ["currency"] = invoice.Currency,
            ["description"] = string.Join(", ", invoice.LineItems.Select(x => x.Description)),
            ["sub_total"] = FormatCurrency(invoice.SubTotal, invoice.Currency),
            ["total_gst"] = FormatCurrency(invoice.TotalGST, invoice.Currency),
            ["tax_amount"] = FormatCurrency(invoice.TaxAmount, invoice.Currency),
            ["amount"] = FormatCurrency(invoice.Total, invoice.Currency),
            ["payment_made"] = FormatCurrency(paymentAmountShownInEmail, invoice.Currency),
            ["balance_due"] = FormatCurrency(balanceDue, invoice.Currency),
            ["payment_reference"] = invoice.PaymentReference ?? "",
            ["notes"] = invoice.Notes ?? "",
            ["total_in_words"] = invoice.TotalInWords ?? "",
            ["line_items_html"] = BuildInvoiceLineItemsHtml(invoice),
            ["gst_line_breakdown_html"] = await BuildInvoiceGstLineBreakdownHtmlAsync(invoice),
            ["actor_name"] = actorName,
            ["details_text"] = detailsText,
            ["invoice_status"] = statusLabel,
            ["action_date"] = DateTime.UtcNow.ToString("dd MMM yyyy hh:mm tt 'UTC'"),
        };
        if (!string.IsNullOrWhiteSpace(linkType))
            dict["link_type"] = linkType.Trim();
        return dict;
    }

    private async Task<string> BuildInvoiceGstLineBreakdownHtmlAsync(Invoice invoice)
    {
        var items = invoice.LineItems?.OrderBy(l => l.LineNumber).ToList() ?? new List<InvoiceLineItem>();
        if (items.Count == 0) return string.Empty;
        var sb = new StringBuilder();
        for (var i = 0; i < items.Count; i++)
        {
            var item = items[i];
            if (item.GSTAmount <= 0) continue;
            string? name = item.GSTConfig?.Name;
            decimal? rate = item.GSTConfig?.Rate;
            if (item.GSTConfigId.HasValue && (name == null || rate == null))
            {
                var tc = await _db.TaxConfigurations.AsNoTracking().FirstOrDefaultAsync(t => t.Id == item.GSTConfigId.Value);
                if (tc != null)
                {
                    name = tc.Name;
                    rate = tc.Rate;
                }
            }
            var labelBase = $"{name ?? "GST"} ({(rate ?? 0):N2}%)";
            var desc = item.Description?.Trim();
            var labelSuffix = !string.IsNullOrEmpty(desc)
                ? $" · {(desc.Length > 40 ? desc[..40] + "…" : desc)}"
                : $" · #{i + 1}";
            var fullLabel = WebUtility.HtmlEncode(labelBase + labelSuffix);
            sb.Append($"""
                <div style="display:flex;justify-content:space-between;font-size:12px;color:#111827;margin-bottom:6px;padding-left:2px;padding-right:2px;">
                    <span>{fullLabel}</span><strong>{FormatCurrency(item.GSTAmount, invoice.Currency)}</strong>
                </div>
                """);
        }
        return sb.ToString();
    }

    private static string BuildInvoiceLineItemsHtml(Invoice invoice)
    {
        var rows = invoice.LineItems
            .OrderBy(x => x.LineNumber)
            .Select(item =>
                $"""
                <tr>
                    <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">{item.LineNumber}</td>
                    <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-weight:500;">{System.Net.WebUtility.HtmlEncode(item.Description)}</td>
                    <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">{System.Net.WebUtility.HtmlEncode(item.HSNCode ?? "—")}</td>
                    <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:right;">{item.Quantity:N2}</td>
                    <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:right;">{FormatCurrency(item.Rate, invoice.Currency)}</td>
                    <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:right;">{FormatCurrency(item.GSTAmount, invoice.Currency)}</td>
                    <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:600;">{FormatCurrency(item.TotalAmount, invoice.Currency)}</td>
                </tr>
                """);

        return string.Join(string.Empty, rows);
    }

    private static InvoiceDto MapToDto(Invoice inv) => new(
     inv.Id, inv.InvoiceCode,
     inv.ClientId, inv.Client.Name, inv.Client.Email,
     inv.Client.ContactPerson, inv.Client.Country, inv.Currency,
     inv.SubTotal, inv.TotalGST, inv.TaxConfig?.Name, inv.TaxConfigId, inv.TaxAmount, inv.Total, inv.paidAmound,
     inv.InvoiceDate, inv.DueDate, inv.PaymentTerms, inv.PurchaseOrder,
     GetDisplayStatus(inv), inv.Notes, inv.TotalInWords,
     inv.PaymentReference, inv.PaidAt, inv.CreatedAt,
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
        var today = DateTime.UtcNow.Date;
        var isOverdue = inv.DueDate < today && inv.paidAmound < inv.Total && inv.Status != InvoiceStatus.Paid;
        return isOverdue ? InvoiceStatus.Overdue.ToString() : inv.Status.ToString();
    }
}
