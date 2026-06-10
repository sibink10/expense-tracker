using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class AssetHistory
{
    public int Id { get; set; }

    public int AssetId { get; set; }

    public Guid? EmployeeId { get; set; }

    public string Action { get; set; } = null!;

    public string? Notes { get; set; }

    public DateTime ActionAt { get; set; }

    public Guid? ActionBy { get; set; }

    public virtual Employee? ActionByNavigation { get; set; }

    public virtual Asset Asset { get; set; } = null!;

    public virtual Employee? Employee { get; set; }
}
