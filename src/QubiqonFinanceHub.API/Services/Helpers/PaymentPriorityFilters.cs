using QubiqonFinanceHub.API.Models.Enums;

namespace QubiqonFinanceHub.API.Services.Helpers;

/// <summary>Parses query-string values for filtering lists by vendor bill payment priority.</summary>
internal static class PaymentPriorityFilters
{
    public static bool TryParseListFilter(string? raw, out PaymentPriority value)
    {
        value = default;
        if (string.IsNullOrWhiteSpace(raw)) return false;
        var t = raw.Trim().ToLowerInvariant();
        if (t is "later" or "paylater" or "pay later")
        {
            value = PaymentPriority.Later;
            return true;
        }
        if (t is "immediate" or "pay immediately" or "payimmediate" or "now")
        {
            value = PaymentPriority.Immediate;
            return true;
        }
        return Enum.TryParse(raw.Trim(), true, out value);
    }
}
