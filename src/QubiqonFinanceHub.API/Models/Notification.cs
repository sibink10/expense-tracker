using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class Notification
{
    public int Id { get; set; }

    public Guid OrganizationId { get; set; }

    public Guid RecipientId { get; set; }

    public string Title { get; set; } = null!;

    public string? Body { get; set; }

    public string? Type { get; set; }

    public bool IsRead { get; set; }

    public string? RefEntityType { get; set; }

    public int? RefEntityId { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual Organization Organization { get; set; } = null!;

    public virtual Employee Recipient { get; set; } = null!;
}
