using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class RevenuePoint
{
    public string Month { get; set; } = null!;

    public double Revenue { get; set; }

    public Guid? CreatedById { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public virtual Employee? CreatedBy { get; set; }
}
