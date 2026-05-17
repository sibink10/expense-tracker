using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class VendorBill
{
    public Guid Id { get; set; }

    public Guid OrganizationId { get; set; }

    public string BillCode { get; set; } = null!;

    public Guid VendorId { get; set; }

    public decimal Amount { get; set; }

    public Guid? TaxConfigId { get; set; }

    public decimal Tdsamount { get; set; }

    public decimal TotalPayable { get; set; }

    public string Description { get; set; } = null!;

    public DateTime BillDate { get; set; }

    public DateTime DueDate { get; set; }

    public string PaymentTerms { get; set; } = null!;

    public string Status { get; set; } = null!;

    public string? AttachmentUrl { get; set; }

    public string? Ccemails { get; set; }

    public Guid SubmittedByEmployeeId { get; set; }

    public string? PaymentReference { get; set; }

    public DateTime? PaidAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public string VendorBillNumber { get; set; } = null!;

    public decimal DiscountPercent { get; set; }

    public decimal Rounding { get; set; }

    public decimal PaidAmount { get; set; }

    public int PaymentPriority { get; set; }

    public virtual ICollection<ActivityComment> ActivityComments { get; set; } = new List<ActivityComment>();

    public virtual ICollection<RequestDocument> RequestDocuments { get; set; } = new List<RequestDocument>();

    public virtual TaxConfiguration? TaxConfig { get; set; }

    public virtual Vendor Vendor { get; set; } = null!;

    public virtual ICollection<VendorBillLineItem> VendorBillLineItems { get; set; } = new List<VendorBillLineItem>();
}
