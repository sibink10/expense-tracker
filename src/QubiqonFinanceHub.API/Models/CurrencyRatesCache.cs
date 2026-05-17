using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class CurrencyRatesCache
{
    public string Base { get; set; } = null!;

    public string Currency { get; set; } = null!;

    public double Value { get; set; }

    public bool IsSelected { get; set; }

    public bool Valid { get; set; }

    public long ApiUpdated { get; set; }

    public DateTime SyncedAt { get; set; }
}
