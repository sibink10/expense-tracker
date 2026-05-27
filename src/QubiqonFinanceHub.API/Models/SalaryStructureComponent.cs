using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class SalaryStructureComponent
{
    public int Id { get; set; }

    public int SalaryStructureId { get; set; }

    public int ComponentId { get; set; }

    public string? Formula { get; set; }

    public decimal? FixedAmount { get; set; }

    public int SortOrder { get; set; }

    public virtual PayrollComponent Component { get; set; } = null!;

    public virtual SalaryStructure SalaryStructure { get; set; } = null!;
}
