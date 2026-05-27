using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class Grade
{
    public int Id { get; set; }

    public Guid OrganizationId { get; set; }

    public int? BusinessUnitId { get; set; }

    public string Name { get; set; } = null!;

    public bool IsActive { get; set; }

    public virtual BusinessUnit? BusinessUnit { get; set; }

    public virtual ICollection<Employee> Employees { get; set; } = new List<Employee>();

    public virtual Organization Organization { get; set; } = null!;
}
