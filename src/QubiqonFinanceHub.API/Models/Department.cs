using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class Department
{
    public int Id { get; set; }

    public Guid OrganizationId { get; set; }

    public int? BusinessUnitId { get; set; }

    public string Name { get; set; } = null!;

    public Guid? HeadEmployeeId { get; set; }

    public bool IsActive { get; set; }

    public virtual BusinessUnit? BusinessUnit { get; set; }

    public virtual ICollection<Designation> Designations { get; set; } = new List<Designation>();

    public virtual Employee? HeadEmployee { get; set; }

    public virtual Organization Organization { get; set; } = null!;
}
