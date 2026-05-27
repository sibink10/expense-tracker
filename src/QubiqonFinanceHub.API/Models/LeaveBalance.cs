using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class LeaveBalance
{
    public int Id { get; set; }

    public Guid EmployeeId { get; set; }

    public int LeaveTypeId { get; set; }

    public int Year { get; set; }

    public decimal OpeningBalance { get; set; }

    public decimal Accrued { get; set; }

    public decimal CarryForward { get; set; }

    public decimal Used { get; set; }

    public decimal Adjusted { get; set; }

    public decimal Lapsed { get; set; }

    public decimal Encashed { get; set; }

    public virtual Employee Employee { get; set; } = null!;

    public virtual LeaveType LeaveType { get; set; } = null!;
}
