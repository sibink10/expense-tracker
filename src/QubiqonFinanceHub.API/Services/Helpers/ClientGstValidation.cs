using System.Text.RegularExpressions;

namespace QubiqonFinanceHub.API.Services.Helpers;

public record GstTreatmentFieldFlags(
    bool ShowGstin,
    bool ShowPlaceOfSupply,
    bool ShowTaxPreference,
    bool ShowPan,
    bool ShowBusinessLegalName,
    bool ShowBusinessTradeName);

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

    public static string? NormalizeTaxExemptionReason(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    public static string? NormalizeBusinessName(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    public static void Validate(
        bool isTaxable,
        Guid? gstTreatmentId,
        string? gstin,
        string? placeOfSupplyCode,
        string? pan,
        string? taxExemptionReason,
        string? businessLegalName,
        string? businessTradeName,
        GstTreatmentFieldFlags? treatmentFlags = null)
    {
        var flags = treatmentFlags ?? new GstTreatmentFieldFlags(true, true, true, true, false, false);

        if (flags.ShowTaxPreference && !isTaxable)
        {
            if (string.IsNullOrWhiteSpace(taxExemptionReason))
                throw new InvalidOperationException("Exemption reason is required when tax preference is tax exempt.");
        }

        if (gstTreatmentId.HasValue && flags.ShowGstin && string.IsNullOrWhiteSpace(gstin))
            throw new InvalidOperationException("GSTIN/UIN is required for the selected GST treatment.");

        var normalizedGstin = NormalizeGstin(gstin);
        if (!string.IsNullOrEmpty(normalizedGstin))
        {
            if (normalizedGstin.Length == 15 && !GstinRegex.IsMatch(normalizedGstin))
                throw new InvalidOperationException("Invalid GSTIN format.");

            if (flags.ShowPlaceOfSupply && string.IsNullOrWhiteSpace(placeOfSupplyCode))
                throw new InvalidOperationException("Place of supply is required when GSTIN/UIN is provided.");
        }

        var normalizedPan = NormalizePan(pan);
        if (gstTreatmentId.HasValue && flags.ShowPan && string.IsNullOrWhiteSpace(normalizedPan))
            throw new InvalidOperationException("PAN is required for the selected GST treatment.");

        if (!string.IsNullOrEmpty(normalizedPan) && !PanRegex.IsMatch(normalizedPan))
            throw new InvalidOperationException("Invalid PAN format.");
    }
}
