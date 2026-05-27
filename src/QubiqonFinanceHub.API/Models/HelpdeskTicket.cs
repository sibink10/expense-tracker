using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class HelpdeskTicket
{
    public int Id { get; set; }

    public Guid OrganizationId { get; set; }

    public string TicketNumber { get; set; } = null!;

    public Guid RaisedById { get; set; }

    public int CategoryId { get; set; }

    public string Title { get; set; } = null!;

    public string Description { get; set; } = null!;

    public string Priority { get; set; } = null!;

    public string Status { get; set; } = null!;

    public Guid? AssignedToId { get; set; }

    public DateTime? AssignedAt { get; set; }

    public string? ResolutionNote { get; set; }

    public DateTime? ResolvedAt { get; set; }

    public DateTime? ClosedAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual Employee? AssignedTo { get; set; }

    public virtual HelpdeskCategory Category { get; set; } = null!;

    public virtual ICollection<HelpdeskComment> HelpdeskComments { get; set; } = new List<HelpdeskComment>();

    public virtual Organization Organization { get; set; } = null!;

    public virtual Employee RaisedBy { get; set; } = null!;
}
