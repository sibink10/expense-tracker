using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class ResourceAllocation
{
    public Guid Id { get; set; }

    public string ResourceId { get; set; } = null!;

    public string EngagementId { get; set; } = null!;

    public double AllocPct { get; set; }

    public string StartDate { get; set; } = null!;

    public string EndDate { get; set; } = null!;

    public bool Billable { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public virtual Engagement Engagement { get; set; } = null!;

    public virtual Resource Resource { get; set; } = null!;
}
