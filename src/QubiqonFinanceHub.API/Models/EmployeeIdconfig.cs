using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class EmployeeIdconfig
{
    public int Id { get; set; }

    public Guid OrganizationId { get; set; }

    public string Mode { get; set; } = null!;

    public string? Prefix { get; set; }

    public int StartNumber { get; set; }

    public int Padding { get; set; }

    public string Separator { get; set; } = null!;

    public int LastNumber { get; set; }

    public virtual Organization Organization { get; set; } = null!;
}
