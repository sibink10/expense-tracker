using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class RefreshToken
{
    public string Token { get; set; } = null!;

    public Guid EmployeeId { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public virtual Employee Employee { get; set; } = null!;
}
