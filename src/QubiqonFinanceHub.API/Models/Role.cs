using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class Role
{
    public int Id { get; set; }

    public string DisplayName { get; set; } = null!;

    public string Code { get; set; } = null!;

    public bool IsActive { get; set; }

    public Guid? AppId { get; set; }

    public virtual App? App { get; set; }

    public virtual ICollection<EmployeeRole> EmployeeRoles { get; set; } = new List<EmployeeRole>();

    public virtual ICollection<QhrmsemployeeRole> QhrmsemployeeRoles { get; set; } = new List<QhrmsemployeeRole>();

    public virtual ICollection<QscmemployeeRole> QscmemployeeRoles { get; set; } = new List<QscmemployeeRole>();
}
