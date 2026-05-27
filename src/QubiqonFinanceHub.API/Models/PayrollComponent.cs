using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class PayrollComponent
{
    public int Id { get; set; }

    public Guid OrganizationId { get; set; }

    public string Name { get; set; } = null!;

    public string ComponentType { get; set; } = null!;

    public bool IsTaxable { get; set; }

    public string? Formula { get; set; }

    public decimal? FixedAmount { get; set; }

    public bool IsSystemComponent { get; set; }

    public bool IsActive { get; set; }

    public virtual Organization Organization { get; set; } = null!;

    public virtual ICollection<SalaryStructureComponent> SalaryStructureComponents { get; set; } = new List<SalaryStructureComponent>();
}
