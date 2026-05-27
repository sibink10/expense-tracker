using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class GeneratedLetter
{
    public int Id { get; set; }

    public Guid EmployeeId { get; set; }

    public int LetterTypeId { get; set; }

    public string? LetterNumber { get; set; }

    public string? HtmlContent { get; set; }

    public string Status { get; set; } = null!;

    public Guid? GeneratedById { get; set; }

    public DateTime GeneratedAt { get; set; }

    public virtual Employee Employee { get; set; } = null!;

    public virtual Employee? GeneratedBy { get; set; }

    public virtual LetterType LetterType { get; set; } = null!;
}
