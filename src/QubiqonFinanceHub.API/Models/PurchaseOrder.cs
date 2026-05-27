using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class PurchaseOrder
{
    public Guid Id { get; set; }

    public string Ponumber { get; set; } = null!;

    public DateTime Podate { get; set; }

    public DateTime DeliveryDate { get; set; }

    public Guid RequestId { get; set; }

    public Guid QuotationId { get; set; }

    public string BuyerCompanyName { get; set; } = null!;

    public string BuyerAddress { get; set; } = null!;

    public string VendorName { get; set; } = null!;

    public string VendorAddress { get; set; } = null!;

    public string VendorEmail { get; set; } = null!;

    public string DeliverToAddress { get; set; } = null!;

    public decimal SubTotal { get; set; }

    public decimal Total { get; set; }

    public string PaymentMode { get; set; } = null!;

    public string PaymentTerms { get; set; } = null!;

    public string PaymentTermsText { get; set; } = null!;

    public string ScopeOfServices { get; set; } = null!;

    public string DeliveryInstallationTerms { get; set; } = null!;

    public string TestingAcceptanceClause { get; set; } = null!;

    public string WarrantiesSupport { get; set; } = null!;

    public string TerminationClause { get; set; } = null!;

    public string ConfidentialityClause { get; set; } = null!;

    public string? InternalComments { get; set; }

    public string Status { get; set; } = null!;

    public string? ZohoSignRequestId { get; set; }

    public string? ZohoSignStatus { get; set; }

    public string? SignedPdfUrl { get; set; }

    public Guid CreatedById { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public bool IsDeleted { get; set; }

    public virtual Employee CreatedBy { get; set; } = null!;

    public virtual ICollection<PolineItem> PolineItems { get; set; } = new List<PolineItem>();

    public virtual Quotation Quotation { get; set; } = null!;

    public virtual MaterialRequest Request { get; set; } = null!;
}
