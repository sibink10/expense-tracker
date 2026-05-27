using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class Pfoption
{
    public int Id { get; set; }

    public Guid OrganizationId { get; set; }

    public string Name { get; set; } = null!;

    public string ContributionType { get; set; } = null!;

    public decimal? ContributionValue { get; set; }

    public bool IsDefault { get; set; }

    public bool IsActive { get; set; }

    public virtual Organization Organization { get; set; } = null!;
}
