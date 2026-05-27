using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class QscmemployeeRole
{
    public Guid Id { get; set; }

    public Guid EmployeeId { get; set; }

    public int RoleId { get; set; }

    public virtual Employee Employee { get; set; } = null!;

    public virtual Role Role { get; set; } = null!;
}
