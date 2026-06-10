using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using QubiqonFinanceHub.API.Auth.Shared;
using QubiqonFinanceHub.API.Data;
using QubiqonFinanceHub.API.Models.Entities;
using QubiqonFinanceHub.API.Models.Enums;

namespace QubiqonFinanceHub.API.Auth.Finance;

public interface IGlobalAuthService
{
    string GetOAuthRedirectUri();
    bool IsLocalhostRedirectUri();
    string BuildLoginUrl(string returnUrl, string callbackUrl);
    bool TryValidateReturnUrl(string returnUrl, out Uri? uri);
    bool TryValidateState(string state, out string? returnUrl);
    string CreateSignedState(string returnUrl);
    Task<AuthSession> CompleteOAuthCallbackAsync(string code, string callbackUrl, CancellationToken ct = default);
    void SetSessionCookie(HttpResponse response, Guid sessionId, bool isLocalhost);
    void ClearSessionCookie(HttpResponse response, bool isLocalhost);
}

public class GlobalAuthService : IGlobalAuthService
{
    private readonly FinanceHubDbContext _db;
    private readonly IAuthSessionStore _sessionStore;
    private readonly IAzureOAuthTokenClient _tokenClient;
    private readonly IConfiguration _config;
    private readonly GlobalAuthOptions _options;
    private readonly IWebHostEnvironment _environment;

    public GlobalAuthService(
        FinanceHubDbContext db,
        IAuthSessionStore sessionStore,
        IAzureOAuthTokenClient tokenClient,
        IConfiguration config,
        IOptions<GlobalAuthOptions> options,
        IWebHostEnvironment environment)
    {
        _db = db;
        _sessionStore = sessionStore;
        _tokenClient = tokenClient;
        _config = config;
        _options = options.Value;
        _environment = environment;
    }

    public string GetOAuthRedirectUri()
    {
        var uri = _options.OAuthRedirectUri?.Trim();
        if (string.IsNullOrEmpty(uri))
            throw new InvalidOperationException("GlobalAuth:OAuthRedirectUri is required.");
        if (!Uri.TryCreate(uri, UriKind.Absolute, out _))
            throw new InvalidOperationException("GlobalAuth:OAuthRedirectUri must be an absolute URL.");
        return uri;
    }

    public bool IsLocalhostRedirectUri()
    {
        var host = new Uri(GetOAuthRedirectUri()).Host;
        return host.Equals("localhost", StringComparison.OrdinalIgnoreCase)
            || host.Equals("127.0.0.1", StringComparison.OrdinalIgnoreCase);
    }

    public string BuildLoginUrl(string returnUrl, string callbackUrl)
    {
        var tenantId = _config["AzureAd:TenantId"]!;
        var clientId = _config["AzureAd:ClientId"]!;
        var serverClientId = _config["ServerApp:ClientId"]!;
        var state = CreateSignedState(returnUrl);

        var query = new Dictionary<string, string?>
        {
            ["client_id"] = clientId,
            ["response_type"] = "code",
            ["redirect_uri"] = callbackUrl,
            ["response_mode"] = "query",
            ["scope"] = $"api://{serverClientId}/access_as_user",
            ["state"] = state,
        };

        var qs = string.Join("&", query.Select(kv =>
            $"{Uri.EscapeDataString(kv.Key)}={Uri.EscapeDataString(kv.Value ?? "")}"));

        return $"https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/authorize?{qs}";
    }

    public bool TryValidateReturnUrl(string returnUrl, out Uri? uri)
    {
        uri = null;
        if (string.IsNullOrWhiteSpace(returnUrl)) return false;
        if (!Uri.TryCreate(returnUrl, UriKind.Absolute, out var parsed)) return false;

        var allowedHosts = NormalizeAllowedHosts(_options.AllowedReturnHosts);
        if (allowedHosts.Length == 0) return false;

        var hostAllowed = allowedHosts.Any(h =>
            parsed.Host.Equals(h, StringComparison.OrdinalIgnoreCase)
            || parsed.Host.EndsWith("." + h, StringComparison.OrdinalIgnoreCase));
        if (!hostAllowed) return false;

        if (parsed.Scheme == Uri.UriSchemeHttps)
            return (uri = parsed) != null;

        if (parsed.Scheme != Uri.UriSchemeHttp) return false;

        var httpOk = parsed.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase)
            || parsed.Host.Equals("127.0.0.1", StringComparison.OrdinalIgnoreCase)
            || _environment.IsDevelopment();
        return httpOk && (uri = parsed) != null;
    }

    private static string[] NormalizeAllowedHosts(string[]? hosts) =>
        (hosts ?? [])
            .Select(NormalizeAllowedHost)
            .Where(h => !string.IsNullOrWhiteSpace(h))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

    private static string NormalizeAllowedHost(string entry)
    {
        var value = entry.Trim();
        if (value.Contains("://", StringComparison.Ordinal) && Uri.TryCreate(value, UriKind.Absolute, out var uri))
            return uri.Host;
        return value.TrimEnd('/');
    }

    public string CreateSignedState(string returnUrl)
    {
        var payload = JsonSerializer.Serialize(new
        {
            returnUrl,
            nonce = Guid.NewGuid().ToString("N"),
            exp = DateTimeOffset.UtcNow.AddMinutes(15).ToUnixTimeSeconds()
        });
        var payloadB64 = Base64UrlEncode(Encoding.UTF8.GetBytes(payload));
        var sig = Sign(payloadB64);
        return $"{payloadB64}.{sig}";
    }

    public bool TryValidateState(string state, out string? returnUrl)
    {
        returnUrl = null;
        var parts = state.Split('.', 2);
        if (parts.Length != 2) return false;

        var expectedSig = Sign(parts[0]);
        if (!CryptographicOperations.FixedTimeEquals(
                Encoding.UTF8.GetBytes(expectedSig),
                Encoding.UTF8.GetBytes(parts[1])))
            return false;

        var json = Encoding.UTF8.GetString(Base64UrlDecode(parts[0]));
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;
        if (root.TryGetProperty("exp", out var expEl) && expEl.GetInt64() < DateTimeOffset.UtcNow.ToUnixTimeSeconds())
            return false;

        if (!root.TryGetProperty("returnUrl", out var urlEl)) return false;
        var url = urlEl.GetString();
        if (string.IsNullOrWhiteSpace(url)) return false;
        if (!TryValidateReturnUrl(url, out _)) return false;

        returnUrl = url;
        return true;
    }

    public async Task<AuthSession> CompleteOAuthCallbackAsync(string code, string callbackUrl, CancellationToken ct = default)
    {
        var result = await _tokenClient.ExchangeAuthorizationCodeAsync(code, callbackUrl, ct);

        var idToken = result.IdToken
            ?? throw new InvalidOperationException("No id_token returned from Microsoft.");

        var handler = new JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(idToken);
        var oid = jwt.Claims.FirstOrDefault(c => c.Type == "oid")?.Value
            ?? jwt.Claims.FirstOrDefault(c => c.Type == "sub")?.Value
            ?? throw new InvalidOperationException("No oid claim in id_token.");
        var email = jwt.Claims.FirstOrDefault(c => c.Type == "preferred_username")?.Value
            ?? jwt.Claims.FirstOrDefault(c => c.Type == "email")?.Value
            ?? "";
        var name = jwt.Claims.FirstOrDefault(c => c.Type == "name")?.Value ?? email;

        await EnsureEmployeeAsync(oid, email, name, ct);

        var session = new AuthSession
        {
            SessionId = Guid.NewGuid(),
            UserOid = oid,
            Email = email,
            AzureAccessToken = result.AccessToken,
            RefreshToken = result.RefreshToken ?? "",
            AccessTokenExpiry = result.ExpiresAtUtc,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(_options.SessionLifetimeDays)
        };

        return await _sessionStore.CreateAsync(session, ct);
    }

    public void SetSessionCookie(HttpResponse response, Guid sessionId, bool isLocalhost)
    {
        var opts = new CookieOptions
        {
            HttpOnly = true,
            Secure = !isLocalhost,
            SameSite = SameSiteMode.Lax,
            Path = "/",
            Expires = DateTimeOffset.UtcNow.AddDays(_options.SessionLifetimeDays)
        };

        if (!isLocalhost && !string.IsNullOrWhiteSpace(_options.CookieDomain))
            opts.Domain = _options.CookieDomain;

        response.Cookies.Append(_options.CookieName, sessionId.ToString(), opts);
    }

    public void ClearSessionCookie(HttpResponse response, bool isLocalhost)
    {
        var opts = new CookieOptions
        {
            HttpOnly = true,
            Secure = !isLocalhost,
            SameSite = SameSiteMode.Lax,
            Path = "/",
            Expires = DateTimeOffset.UnixEpoch
        };

        if (!isLocalhost && !string.IsNullOrWhiteSpace(_options.CookieDomain))
            opts.Domain = _options.CookieDomain;

        response.Cookies.Delete(_options.CookieName, opts);
    }

    private async Task EnsureEmployeeAsync(string oid, string email, string name, CancellationToken ct)
    {
        var emp = await _db.Employees.FirstOrDefaultAsync(e => e.EntraObjectId == oid, ct);
        if (emp != null) return;

        var seedOrg = await _db.Organizations
            .Where(o => o.IsActive)
            .OrderBy(o => o.OrgName)
            .FirstOrDefaultAsync(ct);

        if (seedOrg == null)
            throw new InvalidOperationException("No active organization found for user provisioning.");

        emp = new Employee
        {
            Id = Guid.TryParse(oid, out var parsedId) ? parsedId : Guid.NewGuid(),
            OrganizationId = seedOrg.Id,
            EntraObjectId = oid,
            FullName = name,
            Email = email,
            Role = UserRole.Employee,
            IsActive = true,
            IsDelete = false,
            CreatedAt = DateTime.UtcNow
        };
        _db.Employees.Add(emp);
        await _db.SaveChangesAsync(ct);
    }

    private string Sign(string payloadB64)
    {
        var key = Encoding.UTF8.GetBytes(_options.AppJwtSecret);
        using var hmac = new HMACSHA256(key);
        return Base64UrlEncode(hmac.ComputeHash(Encoding.UTF8.GetBytes(payloadB64)));
    }

    private static string Base64UrlEncode(byte[] data) =>
        Convert.ToBase64String(data).TrimEnd('=').Replace('+', '-').Replace('/', '_');

    private static byte[] Base64UrlDecode(string input)
    {
        var padded = input.Replace('-', '+').Replace('_', '/');
        switch (padded.Length % 4)
        {
            case 2: padded += "=="; break;
            case 3: padded += "="; break;
        }
        return Convert.FromBase64String(padded);
    }
}
