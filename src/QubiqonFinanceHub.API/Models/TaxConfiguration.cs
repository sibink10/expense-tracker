using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class TaxConfiguration
{
    public Guid Id { get; set; }

    public Guid OrganizationId { get; set; }

    public string Type { get; set; } = null!;

    public string Name { get; set; } = null!;

    public decimal Rate { get; set; }

    public string? Section { get; set; }

    public string? SubType { get; set; }

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual ICollection<InvoiceLineItem> InvoiceLineItems { get; set; } = new List<InvoiceLineItem>();

    public virtual ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();

    public virtual Organization Organization { get; set; } = null!;

    public virtual ICollection<PolineItem> PolineItems { get; set; } = new List<PolineItem>();

    public virtual ICollection<PurchaseOrder> PurchaseOrders { get; set; } = new List<PurchaseOrder>();

    public virtual ICollection<VendorBillLineItem> VendorBillLineItems { get; set; } = new List<VendorBillLineItem>();

    public virtual ICollection<VendorBill> VendorBills { get; set; } = new List<VendorBill>();
}
