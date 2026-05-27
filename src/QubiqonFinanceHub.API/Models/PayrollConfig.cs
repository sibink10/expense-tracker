using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class PayrollConfig
{
    public int Id { get; set; }

    public Guid OrganizationId { get; set; }

    public string PackageMode { get; set; } = null!;

    public bool SkipAttendance { get; set; }

    public bool AllowVpf { get; set; }

    public string RoundingMode { get; set; } = null!;

    public virtual Organization Organization { get; set; } = null!;
}
