using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class AdvancePayment
{
    public Guid Id { get; set; }

    public Guid OrganizationId { get; set; }

    public string AdvanceCode { get; set; } = null!;

    public Guid EmployeeId { get; set; }

    public decimal Amount { get; set; }

    public string Purpose { get; set; } = null!;

    public string Status { get; set; } = null!;

    public string? PaymentReference { get; set; }

    public DateTime? DisbursedAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public decimal PaidAmount { get; set; }

    public virtual ICollection<ActivityComment> ActivityComments { get; set; } = new List<ActivityComment>();

    public virtual Employee Employee { get; set; } = null!;
}
