using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class EmployeeSalaryPackage
{
    public int Id { get; set; }

    public Guid EmployeeId { get; set; }

    public int SalaryStructureId { get; set; }

    public DateTime EffectiveFrom { get; set; }

    public DateTime? EffectiveTo { get; set; }

    public decimal? TotalCtc { get; set; }

    public string? ComponentValues { get; set; }

    public bool IsActive { get; set; }

    public Guid? CreatedById { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual Employee? CreatedBy { get; set; }

    public virtual Employee Employee { get; set; } = null!;

    public virtual SalaryStructure SalaryStructure { get; set; } = null!;
}
