using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class Account
{
    public Guid Id { get; set; }

    public Guid OrganizationId { get; set; }

    public string Name { get; set; } = null!;

    public string ShortName { get; set; } = null!;

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}
