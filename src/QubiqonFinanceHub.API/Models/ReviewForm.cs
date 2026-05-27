using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class ReviewForm
{
    public int Id { get; set; }

    public Guid OrganizationId { get; set; }

    public string Title { get; set; } = null!;

    public string? Period { get; set; }

    public int Version { get; set; }

    public string Status { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public virtual Organization Organization { get; set; } = null!;

    public virtual ICollection<ReviewAssignment> ReviewAssignments { get; set; } = new List<ReviewAssignment>();
}
