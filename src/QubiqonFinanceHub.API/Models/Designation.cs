using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class Designation
{
    public int Id { get; set; }

    public Guid OrganizationId { get; set; }

    public int? BusinessUnitId { get; set; }

    public int? DepartmentId { get; set; }

    public string Name { get; set; } = null!;

    public bool IsActive { get; set; }

    public virtual BusinessUnit? BusinessUnit { get; set; }

    public virtual Department? Department { get; set; }

    public virtual Organization Organization { get; set; } = null!;
}
