using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class Shift
{
    public int Id { get; set; }

    public Guid OrganizationId { get; set; }

    public string Name { get; set; } = null!;

    public TimeOnly StartTime { get; set; }

    public TimeOnly EndTime { get; set; }

    public string? ColorCode { get; set; }

    public bool IsActive { get; set; }

    public virtual ICollection<AttendanceEntry> AttendanceEntries { get; set; } = new List<AttendanceEntry>();

    public virtual Organization Organization { get; set; } = null!;
}
