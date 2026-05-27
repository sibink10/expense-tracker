using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class SalaryStructure
{
    public int Id { get; set; }

    public Guid OrganizationId { get; set; }

    public int? BusinessUnitId { get; set; }

    public string Name { get; set; } = null!;

    public bool IsActive { get; set; }

    public virtual BusinessUnit? BusinessUnit { get; set; }

    public virtual ICollection<EmployeeSalaryPackage> EmployeeSalaryPackages { get; set; } = new List<EmployeeSalaryPackage>();

    public virtual Organization Organization { get; set; } = null!;

    public virtual ICollection<SalaryStructureComponent> SalaryStructureComponents { get; set; } = new List<SalaryStructureComponent>();
}
