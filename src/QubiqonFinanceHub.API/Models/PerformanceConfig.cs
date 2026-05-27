using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class PerformanceConfig
{
    public int Id { get; set; }

    public Guid OrganizationId { get; set; }

    public string CycleType { get; set; } = null!;

    public int RatingScale { get; set; }

    public virtual Organization Organization { get; set; } = null!;
}
