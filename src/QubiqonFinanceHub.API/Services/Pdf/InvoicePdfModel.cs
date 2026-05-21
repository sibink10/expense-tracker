namespace QubiqonFinanceHub.API.Services.Pdf;

public sealed class InvoicePdfLineItem
{
    public int LineNumber { get; init; }
    public string Description { get; init; } = "";
    public string? HsnCode { get; init; }
    public decimal Quantity { get; init; }
    public decimal Rate { get; init; }
    public decimal GstAmount { get; init; }
    public decimal LineTotal { get; init; }
}

public sealed class InvoicePdfModel
{
    public string InvoiceCode { get; init; } = "";
    public DateTime InvoiceDate { get; init; }
    public DateTime DueDate { get; init; }
    public string PaymentTerms { get; init; } = "";
    public string? PurchaseOrder { get; init; }
    public string Currency { get; init; } = "INR";
    public string CurrencyLabel { get; init; } = "INR Invoice";

    public string ClientName { get; init; } = "";
    public string? ClientContact { get; init; }
    public string? ClientEmail { get; init; }
    public string BillToText { get; init; } = "";
    public string ShipToText { get; init; } = "";

    public string OrgName { get; init; } = "";
    public string? OrgSubName { get; init; }
    public string OrgAddressBlock { get; init; } = "";
    public byte[]? LogoBytes { get; init; }

    public IReadOnlyList<InvoicePdfLineItem> LineItems { get; init; } = Array.Empty<InvoicePdfLineItem>();

    public decimal SubTotal { get; init; }
    public decimal TotalGst { get; init; }
    public decimal Total { get; init; }
    public decimal PaidAmount { get; init; }
    public decimal BalanceDue { get; init; }
    public string? Notes { get; init; }
    public string? TotalInWords { get; init; }

    public string? BankAccountName { get; init; }
    public string? BankAccountNumber { get; init; }
    public string? IfscCode { get; init; }
    public string? BankName { get; init; }
    public string? BankAddress { get; init; }
    public string? SwiftCode { get; init; }
}
