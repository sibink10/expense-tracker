using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class TimesheetMonthDocument
{
    public Guid Id { get; set; }

    public string EngagementId { get; set; } = null!;

    public string MonthKey { get; set; } = null!;

    public string BlobName { get; set; } = null!;

    public string Url { get; set; } = null!;

    public string FileName { get; set; } = null!;

    public string ContentType { get; set; } = null!;

    public int Size { get; set; }

    public Guid? UploadedById { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public virtual Engagement Engagement { get; set; } = null!;

    public virtual Employee? UploadedBy { get; set; }
}
