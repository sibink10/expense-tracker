using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class BusinessUnit
{
    public int Id { get; set; }

    public Guid OrganizationId { get; set; }

    public string Name { get; set; } = null!;

    public string Code { get; set; } = null!;

    public string? Description { get; set; }

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual ICollection<Department> Departments { get; set; } = new List<Department>();

    public virtual ICollection<Designation> Designations { get; set; } = new List<Designation>();

    public virtual ICollection<Employee> Employees { get; set; } = new List<Employee>();

    public virtual ICollection<Grade> Grades { get; set; } = new List<Grade>();

    public virtual ICollection<HolidayPlan> HolidayPlans { get; set; } = new List<HolidayPlan>();

    public virtual Organization Organization { get; set; } = null!;

    public virtual ICollection<SalaryStructure> SalaryStructures { get; set; } = new List<SalaryStructure>();
}
