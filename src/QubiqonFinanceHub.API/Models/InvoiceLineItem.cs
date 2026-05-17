using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class InvoiceLineItem
{
    public Guid Id { get; set; }

    public Guid InvoiceId { get; set; }

    public int LineNumber { get; set; }

    public string Description { get; set; } = null!;

    public string? Hsncode { get; set; }

    public decimal Quantity { get; set; }

    public decimal Rate { get; set; }

    public decimal Amount { get; set; }

    public Guid? GstconfigId { get; set; }

    public decimal Gstamount { get; set; }

    public decimal TotalAmount { get; set; }

    public virtual TaxConfiguration? Gstconfig { get; set; }

    public virtual Invoice Invoice { get; set; } = null!;
}
