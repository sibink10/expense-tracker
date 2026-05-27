namespace QubiqonFinanceHub.API.Services.Interfaces;

/// <summary>USD-based FX rows from CurrencyRatesCache (units of Currency per 1 USD).</summary>
public interface ICurrencyRateService
{
    /// <returns>Map currency code → units per 1 USD; always includes USD → 1. Sorted codes for dropdown.</returns>
    Task<(IReadOnlyDictionary<string, decimal> UsdRates, List<string> ReportCurrenciesSorted)> LoadUsdReportingRatesAsync(CancellationToken cancellationToken = default);

    /// <summary>Target = Amount × (usdToTarget / usdToSource).</summary>
    decimal? TryConvert(decimal amount, string sourceCurrency, string targetCurrency, IReadOnlyDictionary<string, decimal> rates);
}
