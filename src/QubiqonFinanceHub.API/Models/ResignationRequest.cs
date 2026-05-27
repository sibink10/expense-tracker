using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class ResignationRequest
{
    public int Id { get; set; }

    public Guid EmployeeId { get; set; }

    public int? ExitReasonId { get; set; }

    public string? Comments { get; set; }

    public DateTime? PreferredLwd { get; set; }

    public DateTime? OfficialLwd { get; set; }

    public string Status { get; set; } = null!;

    public Guid? ApproverId { get; set; }

    public DateTime? ApprovedAt { get; set; }

    public DateTime SubmittedAt { get; set; }

    public virtual Employee? Approver { get; set; }

    public virtual Employee Employee { get; set; } = null!;

    public virtual ExitReason? ExitReason { get; set; }
}
