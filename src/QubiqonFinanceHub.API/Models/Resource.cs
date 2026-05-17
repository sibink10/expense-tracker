using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class Resource
{
    public string Id { get; set; } = null!;

    public string Name { get; set; } = null!;

    public string Role { get; set; } = null!;

    public string Skills { get; set; } = null!;

    public double RateInr { get; set; }

    public string Allocations { get; set; } = null!;

    public Guid EmployeeId { get; set; }

    public Guid? CreatedById { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public virtual Employee? CreatedBy { get; set; }

    public virtual Employee Employee { get; set; } = null!;

    public virtual ICollection<Timesheet> Timesheets { get; set; } = new List<Timesheet>();
}
