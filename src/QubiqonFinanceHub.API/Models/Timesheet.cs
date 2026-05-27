using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class Timesheet
{
    public string Id { get; set; } = null!;

    public string ResourceId { get; set; } = null!;

    public string ResourceName { get; set; } = null!;

    public string WeekStart { get; set; } = null!;

    public string WeekEnd { get; set; } = null!;

    public string WeekLabel { get; set; } = null!;

    public string Status { get; set; } = null!;

    public string? SubmittedOn { get; set; }

    public string? ApprovedOn { get; set; }

    public string? RejectedOn { get; set; }

    public string Approver { get; set; } = null!;

    public string? RejectionReason { get; set; }

    public Guid? CreatedById { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public virtual Employee? CreatedBy { get; set; }

    public virtual Resource Resource { get; set; } = null!;

    public virtual ICollection<TimesheetLine> TimesheetLines { get; set; } = new List<TimesheetLine>();
}
