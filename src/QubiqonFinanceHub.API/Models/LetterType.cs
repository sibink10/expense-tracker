using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class LetterType
{
    public int Id { get; set; }

    public Guid OrganizationId { get; set; }

    public string Name { get; set; } = null!;

    public string? HtmlTemplate { get; set; }

    public string Status { get; set; } = null!;

    public virtual ICollection<GeneratedLetter> GeneratedLetters { get; set; } = new List<GeneratedLetter>();

    public virtual Organization Organization { get; set; } = null!;
}
