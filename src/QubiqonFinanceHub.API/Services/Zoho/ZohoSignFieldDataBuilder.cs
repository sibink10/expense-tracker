using System.Globalization;
using Microsoft.Extensions.DependencyInjection;
using QubiqonFinanceHub.API.Models.Zoho;
using QubiqonFinanceHub.API.Services.Interfaces;

namespace QubiqonFinanceHub.API.Services.Zoho;

public static class ZohoSignFieldDataBuilder
{
    public static async Task<ZohoSignFieldDataResult> BuildAsync(
        ZohoSignDocumentType type,
        Guid sourceId,
        IServiceProvider services,
        CancellationToken cancellationToken)
    {
        return type switch
        {
            ZohoSignDocumentType.Invoice =>
                await BuildInvoiceFieldTextDataAsync(sourceId, services, cancellationToken),
            _ => throw new ArgumentException($"Unsupported Zoho Sign document type: {type}")
        };
    }

    private static async Task<ZohoSignFieldDataResult> BuildInvoiceFieldTextDataAsync(
        Guid invoiceId,
        IServiceProvider services,
        CancellationToken cancellationToken)
    {
        var invoiceService = services.GetRequiredService<IInvoiceService>();
        var invoice = await invoiceService.GetByIdAsync(invoiceId);
        if (invoice == null)
            throw new InvalidOperationException("Invoice not found.");

        var email = invoice.ClientEmail?.Trim();
        if (string.IsNullOrWhiteSpace(email))
            throw new InvalidOperationException("Invoice client does not have an email address.");

        var signerName = string.IsNullOrWhiteSpace(invoice.ClientName)
            ? (invoice.ClientContact?.Trim() ?? "Client")
            : invoice.ClientName.Trim();

        var lineSummary = invoice.LineItems.Count == 0
            ? ""
            : string.Join("; ", invoice.LineItems.Take(5).Select(l => l.Description));

        var authDate = TryGetIndiaNow().ToString("dd MMM yyyy", CultureInfo.InvariantCulture);

        var fieldText = new Dictionary<string, string>(StringComparer.Ordinal)
        {
            ["invoice_code"] = MergeFieldOrNa(invoice.InvoiceCode),
            ["client_name"] = MergeFieldOrNa(invoice.ClientName),
            ["client_email"] = MergeFieldOrNa(invoice.ClientEmail),
            ["client_contact"] = MergeFieldOrNa(invoice.ClientContact),
            ["client_country"] = MergeFieldOrNa(invoice.ClientCountry),
            ["invoice_date"] = invoice.InvoiceDate.ToString("dd MMM yyyy", CultureInfo.InvariantCulture),
            ["due_date"] = invoice.DueDate.ToString("dd MMM yyyy", CultureInfo.InvariantCulture),
            ["sub_total"] = FormatCurrency(invoice.SubTotal, invoice.Currency),
            ["total_gst"] = FormatCurrency(invoice.TotalGST ?? 0, invoice.Currency),
            ["tax_amount"] = FormatCurrency(invoice.TaxAmount, invoice.Currency),
            ["total"] = FormatCurrency(invoice.Total, invoice.Currency),
            ["total_in_words"] = MergeFieldOrNa(invoice.TotalInWords),
            ["currency"] = MergeFieldOrNa(invoice.Currency),
            ["payment_terms"] = MergeFieldOrNa(invoice.PaymentTerms),
            ["purchase_order"] = MergeFieldOrNa(invoice.PurchaseOrder),
            ["line_items_summary"] = MergeFieldOrNa(lineSummary),
            ["auth_date"] = authDate
        };

        var fieldDate = new Dictionary<string, string>(StringComparer.Ordinal)
        {
            ["auth_date"] = authDate
        };

        return new ZohoSignFieldDataResult
        {
            SignerEmail = email,
            SignerName = signerName,
            FieldTextData = fieldText,
            FieldDateData = fieldDate
        };
    }

    private static string MergeFieldOrNa(string? value) =>
        string.IsNullOrWhiteSpace(value) ? "NA" : value.Trim();

    private static string FormatCurrency(decimal amount, string currency) =>
        currency switch
        {
            "USD" => $"${amount:N2}",
            "EUR" => $"€{amount:N2}",
            "GBP" => $"£{amount:N2}",
            _ => $"₹{amount:N2}"
        };

    private static DateTime TryGetIndiaNow()
    {
        try
        {
            var ist = TimeZoneInfo.FindSystemTimeZoneById("India Standard Time");
            return TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, ist);
        }
        catch (TimeZoneNotFoundException)
        {
            try
            {
                var ist = TimeZoneInfo.FindSystemTimeZoneById("Asia/Kolkata");
                return TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, ist);
            }
            catch
            {
                return DateTime.UtcNow.AddHours(5.5);
            }
        }
        catch
        {
            return DateTime.UtcNow.AddHours(5.5);
        }
    }
}
