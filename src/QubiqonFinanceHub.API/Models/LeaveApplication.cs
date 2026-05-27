using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class LeaveApplication
{
    public int Id { get; set; }

    public Guid EmployeeId { get; set; }

    public int LeaveTypeId { get; set; }

    public DateTime FromDate { get; set; }

    public DateTime ToDate { get; set; }

    public decimal TotalDays { get; set; }

    public string DayPart { get; set; } = null!;

    public string Reason { get; set; } = null!;

    public string? DocumentUrl { get; set; }

    public string Status { get; set; } = null!;

    public Guid? ApproverId { get; set; }

    public DateTime? ApprovedAt { get; set; }

    public string? RejectionReason { get; set; }

    public DateTime AppliedAt { get; set; }

    public int? ManagerId { get; set; }

    public virtual Employee? Approver { get; set; }

    public virtual Employee Employee { get; set; } = null!;

    public virtual ICollection<LeaveLedgerEntry> LeaveLedgerEntries { get; set; } = new List<LeaveLedgerEntry>();

    public virtual LeaveType LeaveType { get; set; } = null!;
}
