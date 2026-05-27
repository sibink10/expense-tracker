using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class AuditLog
{
    public int Id { get; set; }

    public Guid? OrganizationId { get; set; }

    public Guid? PerformedById { get; set; }

    public string Action { get; set; } = null!;

    public string? EntityType { get; set; }

    public int? EntityId { get; set; }

    public string? OldValues { get; set; }

    public string? NewValues { get; set; }

    public string? Ipaddress { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual Organization? Organization { get; set; }

    public virtual Employee? PerformedBy { get; set; }
}
