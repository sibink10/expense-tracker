using System.Text.RegularExpressions;

namespace QubiqonFinanceHub.API.Services.Helpers;

public static class ClientGstValidation
{
    private static readonly Regex GstinRegex = new(@"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$", RegexOptions.Compiled);
    private static readonly Regex PanRegex = new(@"^[A-Z]{5}[0-9]{4}[A-Z]$", RegexOptions.Compiled);

    public static string? StateCodeFromTaxId(string? gstinOrUin)
    {
        var code = (gstinOrUin ?? "").Trim();
        if (code.Length < 2) return null;
        var state = code[..2];
        return state.All(char.IsDigit) ? state : null;
    }

    public static string? NormalizeGstin(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim().ToUpperInvariant();

    public static string? NormalizePan(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim().ToUpperInvariant();

    public static void Validate(bool isTaxable, Guid? gstTreatmentId, string? gstin, string? placeOfSupplyCode, string? pan)
    {
        if (gstTreatmentId.HasValue && string.IsNullOrWhiteSpace(gstin))
            throw new InvalidOperationException("GSTIN/UIN is required when GST treatment is selected.");

        var normalizedGstin = NormalizeGstin(gstin);
        if (!string.IsNullOrEmpty(normalizedGstin))
        {
            if (normalizedGstin.Length == 15 && !GstinRegex.IsMatch(normalizedGstin))
                throw new InvalidOperationException("Invalid GSTIN format.");

            if (string.IsNullOrWhiteSpace(placeOfSupplyCode))
                throw new InvalidOperationException("Place of supply is required when GSTIN/UIN is provided.");
        }

        var normalizedPan = NormalizePan(pan);
        if (!string.IsNullOrEmpty(normalizedPan) && !PanRegex.IsMatch(normalizedPan))
            throw new InvalidOperationException("Invalid PAN format.");

        _ = isTaxable;
    }
}
