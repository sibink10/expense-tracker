using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;

namespace QubiqonFinanceHub.Mcp.Services;

/// <summary>
/// Bridges an MCP tool call to the Finance REST API on behalf of the signed-in user.
///
/// Flow per user:
///   1. Read the inbound Entra ID access token (the chatbot's Authorization header).
///   2. Exchange it at POST /api/auth/exchange for a Finance app JWT.
///   3. Cache that JWT (keyed by user oid) until shortly before it expires.
///   4. Attach it as the Bearer token on read calls, so the API's existing
///      role + multi-tenant checks apply unchanged.
/// </summary>
public class FinanceApiClient(
    HttpClient http,
    IHttpContextAccessor httpContextAccessor,
    IMemoryCache cache)
{
    private static readonly JsonSerializerOptions IndentedJson = new() { WriteIndented = true };
    private static readonly JsonSerializerOptions CamelCaseJson =
        new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    /// <summary>GET a Finance API path (relative to the configured base, e.g. "expenses/my") and return the raw JSON body.</summary>
    public async Task<string> GetJsonAsync(string path, CancellationToken ct)
    {
        using var req = new HttpRequestMessage(HttpMethod.Get, path);
        return await SendAsync(req, ct);
    }

    /// <summary>POST a JSON body (camelCase) to a Finance API path and return the raw JSON response body.</summary>
    public async Task<string> PostJsonAsync(string path, object body, CancellationToken ct)
    {
        using var req = new HttpRequestMessage(HttpMethod.Post, path)
        {
            Content = new StringContent(
                JsonSerializer.Serialize(body, CamelCaseJson),
                System.Text.Encoding.UTF8,
                "application/json"),
        };
        return await SendAsync(req, ct);
    }

    /// <summary>
    /// POST a multipart/form-data body to a Finance API path (for endpoints bound with [FromForm])
    /// and return the raw JSON response body. Null/empty field values are omitted.
    /// </summary>
    public async Task<string> PostFormAsync(string path, IReadOnlyDictionary<string, string?> fields, CancellationToken ct)
    {
        var content = new MultipartFormDataContent();
        foreach (var (key, value) in fields)
        {
            if (!string.IsNullOrWhiteSpace(value))
                content.Add(new StringContent(value), key);
        }

        using var req = new HttpRequestMessage(HttpMethod.Post, path) { Content = content };
        return await SendAsync(req, ct);
    }

    /// <summary>Attaches the Finance JWT, sends the request, and returns the body or throws on non-2xx.</summary>
    private async Task<string> SendAsync(HttpRequestMessage req, CancellationToken ct)
    {
        var token = await GetFinanceTokenAsync(ct);
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        using var res = await http.SendAsync(req, ct);
        var body = await res.Content.ReadAsStringAsync(ct);

        if (!res.IsSuccessStatusCode)
            throw new InvalidOperationException($"Finance API {(int)res.StatusCode} for {req.Method} {req.RequestUri}: {body}");

        return body;
    }

    private async Task<string> GetFinanceTokenAsync(CancellationToken ct)
    {
        var ctx = httpContextAccessor.HttpContext
            ?? throw new InvalidOperationException("No HTTP context — MCP request is not authenticated.");

        var oid = ctx.User.FindFirstValue("oid")
            ?? ctx.User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new InvalidOperationException("Authenticated user has no oid claim.");

        if (cache.TryGetValue<string>(CacheKey(oid), out var cached) && cached is not null)
            return cached;

        var inbound = GetInboundBearer(ctx)
            ?? throw new InvalidOperationException("Missing inbound Authorization bearer token.");

        var (token, expiresIn) = await ExchangeAsync(inbound, ct);

        // Refresh a minute early to avoid using a token mid-expiry.
        var ttl = TimeSpan.FromSeconds(Math.Max(60, expiresIn - 60));
        cache.Set(CacheKey(oid), token, ttl);
        return token;
    }

    private async Task<(string Token, int ExpiresIn)> ExchangeAsync(string entraToken, CancellationToken ct)
    {
        using var req = new HttpRequestMessage(HttpMethod.Post, "auth/exchange");
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", entraToken);

        using var res = await http.SendAsync(req, ct);
        var body = await res.Content.ReadAsStringAsync(ct);

        if (!res.IsSuccessStatusCode)
            throw new InvalidOperationException($"Token exchange failed ({(int)res.StatusCode}): {body}");

        using var doc = JsonDocument.Parse(body);
        var root = doc.RootElement;
        var token = root.GetProperty("accessToken").GetString()
            ?? throw new InvalidOperationException("Exchange response missing accessToken.");
        var expiresIn = root.TryGetProperty("expiresIn", out var e) ? e.GetInt32() : 3600;
        return (token, expiresIn);
    }

    private static string? GetInboundBearer(HttpContext ctx)
    {
        var header = ctx.Request.Headers.Authorization.ToString();
        const string prefix = "Bearer ";
        return header.StartsWith(prefix, StringComparison.OrdinalIgnoreCase)
            ? header[prefix.Length..].Trim()
            : null;
    }

    private static string CacheKey(string oid) => $"finance-jwt:{oid}";

    /// <summary>Re-indents a JSON payload for readability before handing it to the model.</summary>
    public static string Pretty(string json)
    {
        try
        {
            using var doc = JsonDocument.Parse(json);
            return JsonSerializer.Serialize(doc.RootElement, IndentedJson);
        }
        catch (JsonException)
        {
            return json;
        }
    }
}
