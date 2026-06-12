using System.Text.Json;
using System.Text.Json.Serialization;

namespace QubiqonFinanceHub.API.Auth.Shared;

public interface IAzureOAuthTokenClient
{
    Task<AzureTokenResult> ExchangeAuthorizationCodeAsync(string code, string redirectUri, CancellationToken ct = default);
    Task<AzureTokenResult> RefreshAsync(string refreshToken, CancellationToken ct = default);
}

public sealed class AzureTokenResult
{
    public string AccessToken { get; init; } = "";
    public string? RefreshToken { get; init; }
    public string? IdToken { get; init; }
    public DateTime ExpiresAtUtc { get; init; }
}

public class AzureOAuthTokenClient(IHttpClientFactory httpClientFactory, IConfiguration config) : IAzureOAuthTokenClient
{
    private string OAuthScope =>
        $"api://{config["ServerApp:ClientId"]}/access_as_user offline_access openid profile email";

    public Task<AzureTokenResult> ExchangeAuthorizationCodeAsync(string code, string redirectUri, CancellationToken ct = default) =>
        RequestTokenAsync(new Dictionary<string, string>
        {
            ["grant_type"] = "authorization_code",
            ["code"] = code,
            ["redirect_uri"] = redirectUri,
            ["scope"] = OAuthScope
        }, ct);

    public Task<AzureTokenResult> RefreshAsync(string refreshToken, CancellationToken ct = default) =>
        RequestTokenAsync(new Dictionary<string, string>
        {
            ["grant_type"] = "refresh_token",
            ["refresh_token"] = refreshToken,
            ["scope"] = OAuthScope
        }, ct);

    private async Task<AzureTokenResult> RequestTokenAsync(Dictionary<string, string> fields, CancellationToken ct)
    {
        var tenantId = config["AzureAd:TenantId"]!;
        var clientId = config["AzureAd:ClientId"]!;
        var clientSecret = config["ServerApp:ClientSecret"]!;

        fields["client_id"] = clientId;
        fields["client_secret"] = clientSecret;

        var client = httpClientFactory.CreateClient();
        using var content = new FormUrlEncodedContent(fields);
        var response = await client.PostAsync(
            $"https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/token",
            content,
            ct);

        var body = await response.Content.ReadAsStringAsync(ct);
        if (!response.IsSuccessStatusCode)
            throw new InvalidOperationException($"Azure token request failed: {body}");

        var token = JsonSerializer.Deserialize<AzureTokenResponse>(body)
            ?? throw new InvalidOperationException("Invalid Azure token response.");

        return new AzureTokenResult
        {
            AccessToken = token.AccessToken ?? "",
            RefreshToken = token.RefreshToken,
            IdToken = token.IdToken,
            ExpiresAtUtc = DateTime.UtcNow.AddSeconds(token.ExpiresIn)
        };
    }

    private sealed class AzureTokenResponse
    {
        [JsonPropertyName("access_token")]
        public string? AccessToken { get; set; }

        [JsonPropertyName("refresh_token")]
        public string? RefreshToken { get; set; }

        [JsonPropertyName("id_token")]
        public string? IdToken { get; set; }

        [JsonPropertyName("expires_in")]
        public int ExpiresIn { get; set; }
    }
}
