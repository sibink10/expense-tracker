using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class Wfhrequest
{
    public int Id { get; set; }

    public Guid EmployeeId { get; set; }

    public DateTime FromDate { get; set; }

    public DateTime ToDate { get; set; }

    public string Reason { get; set; } = null!;

    public string Status { get; set; } = null!;

    public Guid? ApproverId { get; set; }

    public DateTime? ApprovedAt { get; set; }

    public string? RejectionReason { get; set; }

    public DateTime SubmittedAt { get; set; }

    public virtual Employee? Approver { get; set; }

    public virtual Employee Employee { get; set; } = null!;
}
