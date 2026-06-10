using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class PolineItem
{
    public Guid Id { get; set; }

    public Guid PurchaseOrderId { get; set; }

    public string Description { get; set; } = null!;

    public decimal Quantity { get; set; }

    public string Unit { get; set; } = null!;

    public decimal UnitPrice { get; set; }

    public decimal Amount { get; set; }

    public int SortOrder { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public bool IsDeleted { get; set; }

    public Guid? GstconfigId { get; set; }

    public virtual TaxConfiguration? Gstconfig { get; set; }

    public virtual PurchaseOrder PurchaseOrder { get; set; } = null!;
}
