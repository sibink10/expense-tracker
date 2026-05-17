using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class ExpenseRequest
{
    public Guid Id { get; set; }

    public Guid OrganizationId { get; set; }

    public string ExpenseCode { get; set; } = null!;

    public Guid EmployeeId { get; set; }

    public Guid? SubmittedByEmployeeId { get; set; }

    public decimal Amount { get; set; }

    public string Purpose { get; set; } = null!;

    public string Status { get; set; } = null!;

    public string? BillImageUrl { get; set; }

    public string? PaymentReference { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public DateOnly BillDate { get; set; }

    public decimal PaidAmount { get; set; }

    public virtual ICollection<ActivityComment> ActivityComments { get; set; } = new List<ActivityComment>();

    public virtual Employee Employee { get; set; } = null!;

    public virtual ICollection<RequestDocument> RequestDocuments { get; set; } = new List<RequestDocument>();
}
