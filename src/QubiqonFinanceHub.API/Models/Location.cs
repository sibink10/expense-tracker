using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class Location
{
    public int Id { get; set; }

    public Guid OrganizationId { get; set; }

    public string Name { get; set; } = null!;

    public string? City { get; set; }

    public string? State { get; set; }

    public string? Pincode { get; set; }

    public string Country { get; set; } = null!;

    public bool IsActive { get; set; }

    public Guid? EmployeeId { get; set; }

    public virtual Employee? Employee { get; set; }

    public virtual Organization Organization { get; set; } = null!;
}
