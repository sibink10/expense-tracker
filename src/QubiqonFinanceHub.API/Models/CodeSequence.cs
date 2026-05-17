using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class CodeSequence
{
    public Guid Id { get; set; }

    public Guid OrganizationId { get; set; }

    public string SequenceType { get; set; } = null!;

    public int LastNumber { get; set; }
}
