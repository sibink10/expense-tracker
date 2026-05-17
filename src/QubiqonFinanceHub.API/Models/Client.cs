using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class Client
{
    public Guid Id { get; set; }

    public Guid OrganizationId { get; set; }

    public string Name { get; set; } = null!;

    public string? ContactPerson { get; set; }

    public string Email { get; set; } = null!;

    public string? Phone { get; set; }

    public string Country { get; set; } = null!;

    public string Currency { get; set; } = null!;

    public string TaxType { get; set; } = null!;

    public string? Gstin { get; set; }

    public string? Address { get; set; }

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public string? BillingAddress { get; set; }

    public int CustomerType { get; set; }

    public string? ShippingAddress { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public bool IsDelete { get; set; }

    public virtual ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
}
