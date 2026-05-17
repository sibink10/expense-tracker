using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class EmployeeOrganizationContext
{
    public Guid EmployeeId { get; set; }

    public Guid? ActiveOrganizationId { get; set; }

    public DateTime UpdatedAt { get; set; }

    public virtual Organization? ActiveOrganization { get; set; }

    public virtual Employee Employee { get; set; } = null!;
}
