using Microsoft.EntityFrameworkCore;
using QubiqonFinanceHub.API.Data;
using QubiqonFinanceHub.API.Models.Entities;
using QubiqonFinanceHub.API.Services.Interfaces;
using QuestPDF.Fluent;

namespace QubiqonFinanceHub.API.Services.Pdf;

public interface IInvoicePdfGenerator
{
    Task<byte[]> GenerateAsync(Guid invoiceId, CancellationToken cancellationToken = default);
    Task<InvoicePdfModel> BuildModelAsync(Guid invoiceId, CancellationToken cancellationToken = default);
}

public sealed class InvoicePdfGenerator : IInvoicePdfGenerator
{
    private const int MaxLogoBytes = 512_000;

    private readonly FinanceHubDbContext _db;
    private readonly IStorageService _storage;

    public InvoicePdfGenerator(FinanceHubDbContext db, IStorageService storage)
    {
        _db = db;
        _storage = storage;
    }

    public async Task<byte[]> GenerateAsync(Guid invoiceId, CancellationToken cancellationToken = default)
    {
        var model = await BuildModelAsync(invoiceId, cancellationToken);
        return await Task.Run(() => new InvoicePdfDocument(model).GeneratePdf(), cancellationToken);
    }

    public async Task<InvoicePdfModel> BuildModelAsync(Guid invoiceId, CancellationToken cancellationToken = default)
    {
        var inv = await _db.Invoices
            .Include(x => x.Client)
            .Include(x => x.TaxConfig)
            .Include(x => x.LineItems.OrderBy(l => l.LineNumber))
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == invoiceId, cancellationToken)
            ?? throw new KeyNotFoundException("Invoice not found.");

        var org = await _db.Organizations.AsNoTracking()
            .FirstOrDefaultAsync(o => o.Id == inv.OrganizationId, cancellationToken)
            ?? throw new KeyNotFoundException("Organization not found.");

        byte[]? logoBytes = null;
        if (!string.IsNullOrWhiteSpace(org.LogoUrl))
        {
            var downloaded = await _storage.DownloadBytesAsync(org.LogoUrl);
            if (downloaded is { Length: > 0 and <= MaxLogoBytes })
                logoBytes = downloaded;
        }

        var orgLines = BuildAddressLines(org.Address, org.City, org.State, org.Country, org.PostalCode);
        if (!string.IsNullOrWhiteSpace(org.Phone)) orgLines.Add(org.Phone);
        if (!string.IsNullOrWhiteSpace(org.Website)) orgLines.Add(org.Website);

        var billTo = BuildClientBlock(inv.Client, useShipping: false);
        var shipTo = BuildClientBlock(inv.Client, useShipping: true);

        var lineItems = inv.LineItems.Select(l => new InvoicePdfLineItem
        {
            LineNumber = l.LineNumber,
            Description = l.Description,
            HsnCode = l.HSNCode,
            Quantity = l.Quantity,
            Rate = l.Rate,
            GstAmount = l.GSTAmount,
            LineTotal = l.TotalAmount
        }).ToList();

        var paid = inv.paidAmound;
        var balance = Math.Max(inv.Total - paid, 0);

        return new InvoicePdfModel
        {
            InvoiceCode = inv.InvoiceCode,
            InvoiceDate = inv.InvoiceDate,
            DueDate = inv.DueDate,
            PaymentTerms = FormatPaymentTerms(inv.PaymentTerms),
            PurchaseOrder = inv.PurchaseOrder,
            Currency = inv.Currency,
            CurrencyLabel = $"{inv.Currency} Invoice",
            ClientName = inv.Client.Name,
            ClientContact = inv.Client.ContactPerson,
            ClientEmail = inv.Client.Email,
            BillToText = billTo,
            ShipToText = shipTo,
            OrgName = org.OrgName,
            OrgSubName = org.SubName,
            OrgAddressBlock = string.Join("\n", orgLines),
            LogoBytes = logoBytes,
            LineItems = lineItems,
            SubTotal = inv.SubTotal,
            TotalGst = inv.TotalGST,
            TaxAmount = inv.TaxAmount,
            TaxName = inv.TaxConfig?.Name,
            Total = inv.Total,
            PaidAmount = paid,
            BalanceDue = balance,
            Notes = inv.Notes,
            TotalInWords = inv.TotalInWords,
            BankAccountName = string.IsNullOrWhiteSpace(org.AccountHolderName) ? org.OrgName : org.AccountHolderName,
            BankAccountNumber = org.AccountNumber,
            IfscCode = org.IfscCode,
            BankName = org.BankName,
            BankAddress = org.BankAddress,
            SwiftCode = org.SwiftCode
        };
    }

    private static List<string> BuildAddressLines(string? address, string? city, string? state, string? country, string? postal)
    {
        var lines = new List<string>();
        if (!string.IsNullOrWhiteSpace(address)) lines.Add(address.Trim());
        var cityState = string.Join(", ", new[] { city, state }.Where(s => !string.IsNullOrWhiteSpace(s)));
        if (!string.IsNullOrWhiteSpace(cityState)) lines.Add(cityState);
        var countryPostal = string.Join(" ", new[] { country, postal }.Where(s => !string.IsNullOrWhiteSpace(s)));
        if (!string.IsNullOrWhiteSpace(countryPostal)) lines.Add(countryPostal);
        return lines;
    }

    private static string BuildPaymentAddress(Organization org)
    {
        var street = org.UseSeparatePaymentAddress && !string.IsNullOrWhiteSpace(org.PaymentAddress)
            ? org.PaymentAddress.Trim()
            : org.Address?.Trim();
        var lines = BuildAddressLines(street, org.City, org.State, org.Country, org.PostalCode);
        return lines.Count > 0 ? string.Join("\n", lines) : "—";
    }

    private static string BuildClientBlock(Client client, bool useShipping)
    {
        var lines = new List<string> { client.Name };
        if (!string.IsNullOrWhiteSpace(client.ContactPerson))
            lines.Add(client.ContactPerson);
        var addr = useShipping
            ? (client.ShippingAddress ?? client.BillingAddress ?? client.Address)
            : (client.BillingAddress ?? client.Address);
        if (!string.IsNullOrWhiteSpace(addr))
            lines.AddRange(addr.Split('\n', StringSplitOptions.RemoveEmptyEntries).Select(s => s.Trim()));
        if (!string.IsNullOrWhiteSpace(client.Email))
            lines.Add(client.Email);
        return string.Join("\n", lines.Where(l => !string.IsNullOrWhiteSpace(l)));
    }

    private static string FormatPaymentTerms(string terms) =>
        terms?.ToLowerInvariant() switch
        {
            "net30" => "Net 30",
            "net15" => "Net 15",
            "net7" => "Net 7",
            "due_on_receipt" or "dueonreceipt" => "Due on Receipt",
            _ => string.IsNullOrWhiteSpace(terms) ? "—" : terms
        };
}
