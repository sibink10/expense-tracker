using System.Text.Json.Serialization;

namespace QubiqonFinanceHub.API.Models.Zoho;

public class ZohoSignSendDocumentResultDto
{
    [JsonPropertyName("code")]
    public int? Code { get; init; }

    [JsonPropertyName("message")]
    public string? Message { get; init; }

    [JsonPropertyName("request_id")]
    public string? RequestId { get; init; }

    [JsonPropertyName("raw_json")]
    public string RawJson { get; init; } = string.Empty;
}
