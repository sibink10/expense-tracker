using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class CompOffRequest
{
    public int Id { get; set; }

    public Guid EmployeeId { get; set; }

    public DateTime WorkedDate { get; set; }

    public string? Reason { get; set; }

    public string Status { get; set; } = null!;

    public Guid? ApproverId { get; set; }

    public DateTime? ApprovedAt { get; set; }

    public DateTime SubmittedAt { get; set; }

    public string? ManagerRequestInternetMessageId { get; set; }

    public string? ManagerRequestSubject { get; set; }

    public virtual Employee? Approver { get; set; }

    public virtual Employee Employee { get; set; } = null!;
}
