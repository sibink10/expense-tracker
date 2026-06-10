using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class EmployeeRole1
{
    public int Id { get; set; }

    public Guid EmployeeId { get; set; }

    public string Role { get; set; } = null!;

    public string? PasswordHash { get; set; }

    public string? EntraObjectId { get; set; }

    public string? EntraSnapshot { get; set; }

    public bool IsActive { get; set; }

    public DateTime AssignedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public virtual Employee Employee { get; set; } = null!;
}
