namespace QubiqonFinanceHub.API.Models.Zoho;

public class ZohoSignFieldDataResult
{
    public required string SignerEmail { get; init; }
    public required string SignerName { get; init; }
    public IReadOnlyDictionary<string, string> FieldTextData { get; init; } =
        new Dictionary<string, string>();
    public IReadOnlyDictionary<string, string>? FieldDateData { get; init; }
}
