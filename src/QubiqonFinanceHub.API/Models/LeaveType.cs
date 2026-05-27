using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class LeaveType
{
    public int Id { get; set; }

    public Guid OrganizationId { get; set; }

    public string Name { get; set; } = null!;

    public string Classification { get; set; } = null!;

    public string? AccrualFrequency { get; set; }

    public decimal? AccrualAmount { get; set; }

    public decimal? MaxBalance { get; set; }

    public bool CarryForwardEnabled { get; set; }

    public decimal? MaxCarryForward { get; set; }

    public bool EncashmentEnabled { get; set; }

    public decimal? MaxEncashment { get; set; }

    public decimal MinDaysPerApplication { get; set; }

    public int? MaxConsecutiveDays { get; set; }

    public bool ProRationOnJoining { get; set; }

    public bool DocumentRequired { get; set; }

    public bool IsActive { get; set; }

    public virtual ICollection<LeaveApplication> LeaveApplications { get; set; } = new List<LeaveApplication>();

    public virtual ICollection<LeaveBalance> LeaveBalances { get; set; } = new List<LeaveBalance>();

    public virtual ICollection<LeaveLedgerEntry> LeaveLedgerEntries { get; set; } = new List<LeaveLedgerEntry>();

    public virtual Organization Organization { get; set; } = null!;
}
