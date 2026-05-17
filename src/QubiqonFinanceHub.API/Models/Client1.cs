using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class Client1
{
    public string Id { get; set; } = null!;

    public string Name { get; set; } = null!;

    public string Industry { get; set; } = null!;

    public string Country { get; set; } = null!;

    public string SinceLabel { get; set; } = null!;

    public double Csat { get; set; }

    public string Status { get; set; } = null!;

    public string Tier { get; set; } = null!;

    public int Engagements { get; set; }

    public int OpenInvoices { get; set; }

    public string PrimaryContact { get; set; } = null!;

    public string History { get; set; } = null!;

    public string Contacts { get; set; } = null!;

    public bool IsDeleted { get; set; }

    public Guid? CreatedById { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public virtual Employee? CreatedBy { get; set; }
}
