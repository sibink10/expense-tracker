using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class WorkMode
{
    public int Id { get; set; }

    public Guid OrganizationId { get; set; }

    public string Name { get; set; } = null!;

    public bool IsActive { get; set; }

    public virtual ICollection<AttendanceEntry> AttendanceEntries { get; set; } = new List<AttendanceEntry>();

    public virtual Organization Organization { get; set; } = null!;
}
