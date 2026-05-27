using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class LeaveLedgerEntry
{
    public int Id { get; set; }

    public Guid EmployeeId { get; set; }

    public int LeaveTypeId { get; set; }

    public DateTime TransactionDate { get; set; }

    public string TransactionType { get; set; } = null!;

    public decimal Days { get; set; }

    public decimal? BalanceAfter { get; set; }

    public string? Remarks { get; set; }

    public int? RefApplicationId { get; set; }

    public Guid? PerformedById { get; set; }

    public virtual Employee Employee { get; set; } = null!;

    public virtual LeaveType LeaveType { get; set; } = null!;

    public virtual Employee? PerformedBy { get; set; }

    public virtual LeaveApplication? RefApplication { get; set; }
}
