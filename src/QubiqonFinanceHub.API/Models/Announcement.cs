using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class Announcement
{
    public int Id { get; set; }

    public Guid OrganizationId { get; set; }

    public string Title { get; set; } = null!;

    public string? Body { get; set; }

    public bool IsPinned { get; set; }

    public DateTime? PublishAt { get; set; }

    public DateTime? ExpireAt { get; set; }

    public Guid? CreatedById { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual Employee? CreatedBy { get; set; }

    public virtual Organization Organization { get; set; } = null!;
}
