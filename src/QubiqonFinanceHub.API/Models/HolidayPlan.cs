using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class HolidayPlan
{
    public int Id { get; set; }

    public Guid OrganizationId { get; set; }

    public int? BusinessUnitId { get; set; }

    public string Name { get; set; } = null!;

    public int Year { get; set; }

    public string Type { get; set; } = null!;

    public bool IsActive { get; set; }

    public int TypeId { get; set; }

    public virtual BusinessUnit? BusinessUnit { get; set; }

    public virtual ICollection<Holiday> Holidays { get; set; } = new List<Holiday>();

    public virtual Organization Organization { get; set; } = null!;

    public virtual HolidayType TypeNavigation { get; set; } = null!;
}
