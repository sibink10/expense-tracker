using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class Vendor
{
    public Guid Id { get; set; }

    public Guid OrganizationId { get; set; }

    public string Name { get; set; } = null!;

    public string? Gstin { get; set; }

    public string Email { get; set; } = null!;

    public string? Phone { get; set; }

    public string? Category { get; set; }

    public string Address { get; set; } = null!;

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public string? AccountNumber { get; set; }

    public string? BankName { get; set; }

    public string? ContactPerson { get; set; }

    public string? IfscCode { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public bool IsDelete { get; set; }

    public virtual ICollection<Quotation> Quotations { get; set; } = new List<Quotation>();

    public virtual ICollection<VendorBill> VendorBills { get; set; } = new List<VendorBill>();
}
