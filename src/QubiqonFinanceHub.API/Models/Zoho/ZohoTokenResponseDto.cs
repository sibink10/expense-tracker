using System.Text.Json.Serialization;

namespace QubiqonFinanceHub.API.Models.Zoho;

public class ZohoTokenResponseDto
{
    [JsonPropertyName("access_token")]
    public string? AccessToken { get; init; }

    [JsonPropertyName("refresh_token")]
    public string? RefreshToken { get; init; }

    [JsonPropertyName("expires_in")]
    public int? ExpiresIn { get; init; }

    [JsonPropertyName("refresh_token_expires_in")]
    public int? RefreshTokenExpiresIn { get; init; }

    [JsonPropertyName("api_domain")]
    public string? ApiDomain { get; init; }

    [JsonPropertyName("token_type")]
    public string? TokenType { get; init; }
}
