using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class MaterialRequest
{
    public Guid Id { get; set; }

    public string RequestId { get; set; } = null!;

    public string ItemName { get; set; } = null!;

    public string Description { get; set; } = null!;

    public string Priority { get; set; } = null!;

    public string Reason { get; set; } = null!;

    public string Department { get; set; } = null!;

    public Guid RequesterId { get; set; }

    public decimal Quantity { get; set; }

    public string Unit { get; set; } = null!;

    public DateTime RequiredByDate { get; set; }

    public string Status { get; set; } = null!;

    public string? RejectionReason { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public bool IsDeleted { get; set; }

    public virtual ICollection<Attachment> Attachments { get; set; } = new List<Attachment>();

    public virtual PurchaseOrder? PurchaseOrder { get; set; }

    public virtual ICollection<Quotation> Quotations { get; set; } = new List<Quotation>();

    public virtual Employee Requester { get; set; } = null!;
}
