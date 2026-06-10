using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class EmployeeProfileExtension
{
    public Guid EmployeeId { get; set; }

    public string? PersonalDataJson { get; set; }

    public string? WorkProfileJson { get; set; }

    public DateTime UpdatedAt { get; set; }

    public string? AdditionalDetailsJson { get; set; }

    public virtual Employee Employee { get; set; } = null!;
}
