using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class Holiday
{
    public int Id { get; set; }

    public int HolidayPlanId { get; set; }

    public DateTime Date { get; set; }

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public virtual HolidayPlan HolidayPlan { get; set; } = null!;
}
