using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class OrganizationSetting
{
    public Guid Id { get; set; }

    public Guid OrganizationId { get; set; }

    public string Key { get; set; } = null!;

    public string Value { get; set; } = null!;

    public DateTime UpdatedAt { get; set; }

    public Guid? OrganizationId1 { get; set; }

    public virtual Organization Organization { get; set; } = null!;

    public virtual Organization? OrganizationId1Navigation { get; set; }
}
