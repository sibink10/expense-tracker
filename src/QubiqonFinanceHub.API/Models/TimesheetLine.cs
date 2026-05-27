using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class TimesheetLine
{
    public Guid Id { get; set; }

    public string TimesheetId { get; set; } = null!;

    public string EngagementId { get; set; } = null!;

    public string Category { get; set; } = null!;

    public string Hours { get; set; } = null!;

    public string? DocumentBlobName { get; set; }

    public string? DocumentUrl { get; set; }

    public string? DocumentFileName { get; set; }

    public string? DocumentContentType { get; set; }

    public int? DocumentSize { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public virtual Timesheet Timesheet { get; set; } = null!;
}
