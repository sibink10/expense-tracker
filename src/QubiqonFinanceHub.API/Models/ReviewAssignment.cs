using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class ReviewAssignment
{
    public int Id { get; set; }

    public int ReviewFormId { get; set; }

    public Guid EmployeeId { get; set; }

    public string SelfEvalStatus { get; set; } = null!;

    public string ManagerEvalStatus { get; set; } = null!;

    public string HrevalStatus { get; set; } = null!;

    public decimal? FinalRating { get; set; }

    public bool IsPublished { get; set; }

    public DateTime? PublishedAt { get; set; }

    public DateTime AssignedAt { get; set; }

    public virtual Employee Employee { get; set; } = null!;

    public virtual ReviewForm ReviewForm { get; set; } = null!;
}
