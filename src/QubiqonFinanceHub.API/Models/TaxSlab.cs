using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class TaxSlab
{
    public int Id { get; set; }

    public Guid OrganizationId { get; set; }

    public string Name { get; set; } = null!;

    public bool IsDefault { get; set; }

    public string? SlabDetails { get; set; }

    public string? FinancialYear { get; set; }

    public bool IsActive { get; set; }

    public virtual Organization Organization { get; set; } = null!;
}
