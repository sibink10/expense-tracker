using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class Quotation
{
    public Guid Id { get; set; }

    public Guid RequestId { get; set; }

    public string VendorName { get; set; } = null!;

    public string VendorEmail { get; set; } = null!;

    public string? VendorAddress { get; set; }

    public decimal QuotedAmount { get; set; }

    public string Currency { get; set; } = null!;

    public DateTime ValidityDate { get; set; }

    public string? Comments { get; set; }

    public bool IsSelected { get; set; }

    public Guid? SelectedBy { get; set; }

    public DateTime? SelectedAt { get; set; }

    public string? AttachmentUrl { get; set; }

    public string? AttachmentName { get; set; }

    public Guid CreatedById { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public bool IsDeleted { get; set; }

    public virtual Employee CreatedBy { get; set; } = null!;

    public virtual ICollection<PurchaseOrder> PurchaseOrders { get; set; } = new List<PurchaseOrder>();

    public virtual MaterialRequest Request { get; set; } = null!;

    public virtual Employee? SelectedByNavigation { get; set; }
}
