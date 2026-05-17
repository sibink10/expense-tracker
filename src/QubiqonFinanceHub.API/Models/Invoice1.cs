using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class Invoice1
{
    public string Id { get; set; } = null!;

    public string ClientId { get; set; } = null!;

    public string ClientName { get; set; } = null!;

    public string EngagementId { get; set; } = null!;

    public double AmountInr { get; set; }

    public string Issued { get; set; } = null!;

    public string Due { get; set; } = null!;

    public string Status { get; set; } = null!;

    public string Type { get; set; } = null!;

    public string DescriptionText { get; set; } = null!;

    public Guid? CreatedById { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public virtual Employee? CreatedBy { get; set; }

    public virtual Engagement Engagement { get; set; } = null!;
}
