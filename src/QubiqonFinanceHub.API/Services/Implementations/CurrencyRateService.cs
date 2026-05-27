using Microsoft.EntityFrameworkCore;
using QubiqonFinanceHub.API.Data;
using QubiqonFinanceHub.API.Services.Interfaces;

namespace QubiqonFinanceHub.API.Services.Implementations;

public class CurrencyRateService : ICurrencyRateService
{
    private readonly FinanceHubDbContext _db;
    private readonly ILogger<CurrencyRateService> _log;

    public CurrencyRateService(FinanceHubDbContext db, ILogger<CurrencyRateService> log)
    {
        _db = db;
        _log = log;
    }

    public async Task<(IReadOnlyDictionary<string, decimal> UsdRates, List<string> ReportCurrenciesSorted)> LoadUsdReportingRatesAsync(
        CancellationToken cancellationToken = default)
    {
        var rows = await _db.CurrencyRatesCaches
            .AsNoTracking()
            .Where(r => r.Valid && r.Base == "USD")
            .OrderByDescending(r => r.SyncedAt)
            .ToListAsync(cancellationToken);

        var usdRates = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase);
        foreach (var r in rows)
        {
            var code = (r.Currency ?? "").Trim().ToUpperInvariant();
            if (code.Length != 3) continue;
            if (usdRates.ContainsKey(code)) continue;

            if (code == "USD")
            {
                usdRates["USD"] = 1m;
                continue;
            }

            if (r.Value <= 0 || double.IsNaN(r.Value)) continue;
            usdRates[code] = (decimal)r.Value;
        }

        usdRates.TryAdd("USD", 1m);

        var sorted = usdRates.Keys.OrderBy(k => k, StringComparer.OrdinalIgnoreCase).ToList();
        return (usdRates, sorted);
    }

    public decimal? TryConvert(decimal amount, string sourceCurrency, string targetCurrency, IReadOnlyDictionary<string, decimal> rates)
    {
        var src = Normalize(sourceCurrency);
        var tgt = Normalize(targetCurrency);

        if (src == tgt) return amount;
        if (src.Length != 3 || tgt.Length != 3) return null;

        if (!rates.TryGetValue(src, out var usdToSource) || usdToSource <= 0)
        {
            _log.LogWarning("Missing or invalid FX rate USD→{Source}", src);
            return null;
        }

        if (!rates.TryGetValue(tgt, out var usdToTarget) || usdToTarget <= 0)
        {
            _log.LogWarning("Missing or invalid FX rate USD→{Target}", tgt);
            return null;
        }

        try
        {
            return decimal.Round(amount * (usdToTarget / usdToSource), 2, MidpointRounding.AwayFromZero);
        }
        catch (OverflowException ex)
        {
            _log.LogWarning(ex, "FX overflow converting {Amount} from {Source} to {Target}", amount, src, tgt);
            return null;
        }
    }

    private static string Normalize(string? code) =>
        string.IsNullOrWhiteSpace(code) ? "" : code.Trim().ToUpperInvariant();
}
