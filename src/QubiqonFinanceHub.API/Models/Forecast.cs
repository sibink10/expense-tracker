using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class Forecast
{
    public Guid Id { get; set; }

    public Guid OrganizationId { get; set; }

    public string Title { get; set; } = null!;

    public string Purpose { get; set; } = null!;

    public string Description { get; set; } = null!;

    public decimal ExpectedAmount { get; set; }

    public DateTime ExpectedExpenseDate { get; set; }

    public string? Notes { get; set; }

    public Guid CreatedByEmployeeId { get; set; }

    public string Status { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<ActivityComment> ActivityComments { get; set; } = new List<ActivityComment>();

    public virtual Employee CreatedByEmployee { get; set; } = null!;

    public virtual ICollection<ExpenseRequest> ExpenseRequests { get; set; } = new List<ExpenseRequest>();

    public virtual ICollection<RequestDocument> RequestDocuments { get; set; } = new List<RequestDocument>();
}
