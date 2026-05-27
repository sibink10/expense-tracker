using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class AttendanceEntry
{
    public int Id { get; set; }

    public Guid EmployeeId { get; set; }

    public DateTime Date { get; set; }

    public int? ShiftId { get; set; }

    public int? WorkModeId { get; set; }

    public TimeOnly? InTime { get; set; }

    public TimeOnly? OutTime { get; set; }

    public string? Remarks { get; set; }

    public string Status { get; set; } = null!;

    public Guid? ApproverId { get; set; }

    public DateTime? ApprovedAt { get; set; }

    public DateTime SubmittedAt { get; set; }

    public virtual Employee? Approver { get; set; }

    public virtual Employee Employee { get; set; } = null!;

    public virtual Shift? Shift { get; set; }

    public virtual WorkMode? WorkMode { get; set; }
}
