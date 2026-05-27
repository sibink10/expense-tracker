using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class ScmAuditLog
{
    public Guid Id { get; set; }

    public string EntityType { get; set; } = null!;

    public Guid EntityId { get; set; }

    public string Action { get; set; } = null!;

    public Guid EmployeeId { get; set; }

    public string IpAddress { get; set; } = null!;

    public string? Details { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public bool IsDeleted { get; set; }

    public virtual Employee Employee { get; set; } = null!;
}
