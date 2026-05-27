using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class HelpdeskComment
{
    public int Id { get; set; }

    public int TicketId { get; set; }

    public Guid AuthorId { get; set; }

    public string Comment { get; set; } = null!;

    public bool IsInternal { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual Employee Author { get; set; } = null!;

    public virtual HelpdeskTicket Ticket { get; set; } = null!;
}
