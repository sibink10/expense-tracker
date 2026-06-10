using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class Invoice
{
    public Guid Id { get; set; }

    public Guid OrganizationId { get; set; }

    public string InvoiceCode { get; set; } = null!;

    public Guid ClientId { get; set; }

    public string Currency { get; set; } = null!;

    public decimal SubTotal { get; set; }

    public decimal TotalGst { get; set; }

    public Guid? TaxConfigId { get; set; }

    public decimal TaxAmount { get; set; }

    public decimal Total { get; set; }

    public DateTime InvoiceDate { get; set; }

    public DateTime DueDate { get; set; }

    public string PaymentTerms { get; set; } = null!;

    public string? PurchaseOrder { get; set; }

    public string Status { get; set; } = null!;

    public string? Notes { get; set; }

    public string? TotalInWords { get; set; }

    public string? PaymentReference { get; set; }

    public DateTime? PaidAt { get; set; }

    public DateTime? SentAt { get; set; }

    public Guid CreatedByEmployeeId { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public decimal PaidAmound { get; set; }

    public string? ZohoSignRequestId { get; set; }

    public string? ZohoSignStatus { get; set; }

    public DateTime? ZohoSignStatusUpdatedAt { get; set; }

    public DateTime? SignatureRequestedAt { get; set; }

    public string? SignedPdfUrl { get; set; }

    public DateTime? SignedAt { get; set; }

    public decimal Tds { get; set; }

    public virtual ICollection<ActivityComment> ActivityComments { get; set; } = new List<ActivityComment>();

    public virtual Client Client { get; set; } = null!;

    public virtual ICollection<InvoiceLineItem> InvoiceLineItems { get; set; } = new List<InvoiceLineItem>();

    public virtual ICollection<RequestDocument> RequestDocuments { get; set; } = new List<RequestDocument>();

    public virtual TaxConfiguration? TaxConfig { get; set; }
}
