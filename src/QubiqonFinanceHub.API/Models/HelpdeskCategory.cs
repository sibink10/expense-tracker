using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class HelpdeskCategory
{
    public int Id { get; set; }

    public Guid OrganizationId { get; set; }

    public string Name { get; set; } = null!;

    public string Type { get; set; } = null!;

    public bool IsActive { get; set; }

    public virtual ICollection<HelpdeskTicket> HelpdeskTickets { get; set; } = new List<HelpdeskTicket>();

    public virtual Organization Organization { get; set; } = null!;
}
