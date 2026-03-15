using Microsoft.EntityFrameworkCore;
using QubiqonFinanceHub.API.Data;
using QubiqonFinanceHub.API.DTOs;
using QubiqonFinanceHub.API.Models.Entities;
using QubiqonFinanceHub.API.Models.Enums;
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
        var orgId = _tenant.GetCurrentOrganizationId();
        var emp = await _tenant.GetCurrentEmployeeAsync();
        var client = await _db.Clients.FindAsync(dto.ClientId)
            ?? throw new KeyNotFoundException("Client not found");

        var code = await _codeGen.GenerateCodeAsync(orgId, "invoice");

        var invoice = new Invoice
        {
            Id = Guid.NewGuid(), OrganizationId = orgId, InvoiceCode = code,
            ClientId = dto.ClientId, Currency = dto.Currency,
            InvoiceDate = dto.InvoiceDate, DueDate = dto.DueDate,
            PaymentTerms = dto.PaymentTerms, PurchaseOrder = dto.PurchaseOrder,
            Notes = dto.Notes, TaxConfigId = dto.TaxConfigId,
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

        if (dto.SendImmediately)
        {
            await _email.SendNotificationAsync("invoice_sent",
                new Dictionary<string, string>
                {
                    ["client_name"] = client.Name,
                    ["invoice_number"] = code,
                    ["invoice_date"] = dto.InvoiceDate.ToString("dd/MM/yyyy"),
                    ["due_date"] = dto.DueDate.ToString("dd/MM/yyyy"),
                    ["amount"] = FormatCurrency(invoice.Total, dto.Currency),
                    ["balance_due"] = FormatCurrency(invoice.Total, dto.Currency),
                },
                client.Email);
        }

        _log.LogInformation("Invoice {Code} created for {Client}", code, client.Name);
        return (await GetByIdAsync(invoice.Id))!;
    }

    public async Task<InvoiceDto?> GetByIdAsync(Guid id)
    {
        var orgId = _tenant.GetCurrentOrganizationId();
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
        var orgId = _tenant.GetCurrentOrganizationId();
        var q = _db.Invoices
            .Include(x => x.Client)
            .Include(x => x.LineItems.OrderBy(l => l.LineNumber)).ThenInclude(l => l.GSTConfig)
            .Include(x => x.TaxConfig)
            .Include(x => x.Comments).ThenInclude(c => c.CommentByEmployee)
            .Where(x => x.OrganizationId == orgId)
            .AsNoTracking();

        if (f.Status != null && Enum.TryParse<InvoiceStatus>(f.Status, true, out var status))
            q = q.Where(x => x.Status == status);
        if (!string.IsNullOrWhiteSpace(f.Search))
        {
            var s = f.Search.ToLower();
            q = q.Where(x => x.InvoiceCode.ToLower().Contains(s) || x.Client.Name.ToLower().Contains(s));
        }

        var total = await q.CountAsync();
        q = f.Desc ? q.OrderByDescending(x => x.CreatedAt) : q.OrderBy(x => x.CreatedAt);
        var items = await q.Skip((f.Page - 1) * f.PageSize).Take(f.PageSize).ToListAsync();

        return new PaginatedResult<InvoiceDto>(items.Select(MapToDto).ToList(), total, f.Page, f.PageSize);
    }

    public async Task<InvoiceDto> MarkSentAsync(Guid id)
    {
        var orgId = _tenant.GetCurrentOrganizationId();
        var emp = await _tenant.GetCurrentEmployeeAsync();
        var inv = await _db.Invoices.Include(x => x.Client)
            .FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId)
            ?? throw new KeyNotFoundException("Invoice not found");

        inv.Status = InvoiceStatus.Sent;
        inv.SentAt = DateTime.UtcNow;
        inv.UpdatedAt = DateTime.UtcNow;

        _db.ActivityComments.Add(new ActivityComment
        {
            Id = Guid.NewGuid(), InvoiceId = id, CommentByEmployeeId = emp.Id,
            Text = "Invoice sent to client.", ActionType = CommentActionType.Sent
        });

        await _db.SaveChangesAsync();

        await _email.SendNotificationAsync("invoice_sent",
            new Dictionary<string, string>
            {
                ["client_name"] = inv.Client.Name,
                ["invoice_number"] = inv.InvoiceCode,
                ["amount"] = FormatCurrency(inv.Total, inv.Currency),
                ["due_date"] = inv.DueDate.ToString("dd/MM/yyyy"),
            },
            inv.Client.Email);

        return (await GetByIdAsync(id))!;
    }

    public async Task<InvoiceDto> MarkPaidAsync(Guid id, ProcessPaymentRequest dto)
    {
        var orgId = _tenant.GetCurrentOrganizationId();
        var emp = await _tenant.GetCurrentEmployeeAsync();
        var inv = await _db.Invoices.Include(x => x.Client)
            .FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId)
            ?? throw new KeyNotFoundException("Invoice not found");

        inv.Status = InvoiceStatus.Paid;
        inv.PaymentReference = dto.PaymentReference;
        inv.PaidAt = DateTime.UtcNow;
        inv.UpdatedAt = DateTime.UtcNow;

        _db.ActivityComments.Add(new ActivityComment
        {
            Id = Guid.NewGuid(), InvoiceId = id, CommentByEmployeeId = emp.Id,
            Text = $"Payment received. Ref: {dto.PaymentReference}",
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

    private static InvoiceDto MapToDto(Invoice inv) => new(
        inv.Id, inv.InvoiceCode, inv.ClientId, inv.Client.Name, inv.Client.Email,
        inv.Client.ContactPerson, inv.Client.Country, inv.Currency,
        inv.SubTotal, inv.TotalGST, inv.TaxConfig?.Name, inv.TaxAmount, inv.Total,
        inv.InvoiceDate, inv.DueDate, inv.PaymentTerms, inv.PurchaseOrder,
        inv.Status.ToString(), inv.Notes, inv.TotalInWords,
        inv.PaymentReference, inv.PaidAt, inv.CreatedAt,
        inv.LineItems.Select(l => new InvoiceLineItemDto(
            l.LineNumber, l.Description, l.HSNCode, l.Quantity, l.Rate, l.Amount,
            l.GSTConfig?.Name, l.GSTConfig?.Rate ?? 0, l.GSTAmount, l.TotalAmount
        )).ToList(),
        inv.Comments.OrderBy(c => c.CreatedAt).Select(c => new CommentDto(
            c.Id, c.CommentByEmployee.FullName, c.Text, c.ActionType.ToString(), c.CreatedAt
        )).ToList()
    );
}
