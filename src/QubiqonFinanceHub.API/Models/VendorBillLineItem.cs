using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class VendorBillLineItem
{
    public Guid Id { get; set; }

    public Guid VendorBillId { get; set; }

    public int LineNumber { get; set; }

    public string Description { get; set; } = null!;

    public string? Account { get; set; }

    public decimal Quantity { get; set; }

    public decimal Rate { get; set; }

    public Guid? GstconfigId { get; set; }

    public decimal Amount { get; set; }

    public virtual TaxConfiguration? Gstconfig { get; set; }

    public virtual VendorBill VendorBill { get; set; } = null!;
}
