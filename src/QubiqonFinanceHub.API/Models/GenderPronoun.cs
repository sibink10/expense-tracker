using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class GenderPronoun
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public bool IsActive { get; set; }
}
