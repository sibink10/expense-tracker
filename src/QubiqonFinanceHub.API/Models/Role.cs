using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class Role
{
    public int Id { get; set; }

    public string DisplayName { get; set; } = null!;

    public string Code { get; set; } = null!;

    public bool IsActive { get; set; }

    public virtual ICollection<EmployeeRole1> EmployeeRole1s { get; set; } = new List<EmployeeRole1>();

    public virtual ICollection<QscmemployeeRole> QscmemployeeRoles { get; set; } = new List<QscmemployeeRole>();
}
