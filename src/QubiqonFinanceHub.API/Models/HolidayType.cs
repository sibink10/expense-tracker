using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class HolidayType
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public bool IsActive { get; set; }

    public virtual ICollection<HolidayPlan> HolidayPlans { get; set; } = new List<HolidayPlan>();
}
