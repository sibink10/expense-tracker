using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class EmailTemplate
{
    public Guid Id { get; set; }

    public Guid OrganizationId { get; set; }

    public string TemplateKey { get; set; } = null!;

    public string Subject { get; set; } = null!;

    public string HtmlBody { get; set; } = null!;

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual Organization Organization { get; set; } = null!;
}
