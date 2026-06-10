using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class Engagement
{
    public string Id { get; set; } = null!;

    public string ClientId { get; set; } = null!;

    public string ClientName { get; set; } = null!;

    public string Name { get; set; } = null!;

    public string Model { get; set; } = null!;

    public string Status { get; set; } = null!;

    public string StartDate { get; set; } = null!;

    public string EndDate { get; set; } = null!;

    public double Progress { get; set; }

    public string Pm { get; set; } = null!;

    public double? Value { get; set; }

    public double? ValueMonthly { get; set; }

    public int? ResourceCount { get; set; }

    public string? Milestones { get; set; }

    public bool IsDeleted { get; set; }

    public Guid? CreatedById { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public string Currency { get; set; } = null!;

    public string? PurchaseOrder { get; set; }

    public virtual Employee? CreatedBy { get; set; }

    public virtual ICollection<Invoice1> Invoice1s { get; set; } = new List<Invoice1>();

    public virtual ICollection<RequestDocument1> RequestDocument1s { get; set; } = new List<RequestDocument1>();

    public virtual ICollection<ResourceAllocation> ResourceAllocations { get; set; } = new List<ResourceAllocation>();

    public virtual ICollection<TimesheetMonthDocument> TimesheetMonthDocuments { get; set; } = new List<TimesheetMonthDocument>();
}
