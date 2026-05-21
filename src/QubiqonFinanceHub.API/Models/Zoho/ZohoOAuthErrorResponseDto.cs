using System.Text.Json.Serialization;

namespace QubiqonFinanceHub.API.Models.Zoho;

public class ZohoOAuthErrorResponseDto
{
    [JsonPropertyName("error")]
    public string? Error { get; init; }

    [JsonPropertyName("error_description")]
    public string? ErrorDescription { get; init; }
}
