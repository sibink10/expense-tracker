using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Protocols;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;

namespace QubiqonFinanceHub.API.Auth.Shared;

public interface ITrustedAzureAccessTokenValidator
{
    Task<TrustedTokenValidationResult> ValidateAsync(string accessToken, CancellationToken ct = default);
}

public class TrustedAzureAccessTokenValidator : ITrustedAzureAccessTokenValidator
{
    private readonly TrustedAppsOptions _trustedApps;
    private readonly string _tenantId;
    private readonly ConfigurationManager<OpenIdConnectConfiguration> _configManager;
    private readonly HashSet<string> _trustedClientIds;
    private readonly string[] _validAudiences;

    public TrustedAzureAccessTokenValidator(
        IOptions<TrustedAppsOptions> trustedApps,
        IConfiguration config)
    {
        _trustedApps = trustedApps.Value;
        _tenantId = !string.IsNullOrWhiteSpace(_trustedApps.TenantId)
            ? _trustedApps.TenantId.Trim()
            : config["AzureAd:TenantId"]
                ?? throw new InvalidOperationException("AzureAd:TenantId is required.");

        _trustedClientIds = (_trustedApps.Apps ?? [])
            .Select(a => a.ClientId.Trim())
            .Where(id => !string.IsNullOrWhiteSpace(id))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        _validAudiences = _trustedClientIds
            .SelectMany(id => new[] { id, $"api://{id}" })
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        var metadataAddress = $"https://login.microsoftonline.com/{_tenantId}/v2.0/.well-known/openid-configuration";
        _configManager = new ConfigurationManager<OpenIdConnectConfiguration>(
            metadataAddress,
            new OpenIdConnectConfigurationRetriever());
    }

    public async Task<TrustedTokenValidationResult> ValidateAsync(string accessToken, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(accessToken) || _trustedClientIds.Count == 0)
            return TrustedTokenValidationResult.Invalid();

        var handler = new JwtSecurityTokenHandler();
        if (!handler.CanReadToken(accessToken))
            return TrustedTokenValidationResult.NotJwt();

        try
        {
            var openIdConfig = await _configManager.GetConfigurationAsync(ct);

            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuers =
                [
                    $"https://login.microsoftonline.com/{_tenantId}/v2.0",
                    $"https://sts.windows.net/{_tenantId}/"
                ],
                ValidateAudience = true,
                ValidAudiences = _validAudiences,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                IssuerSigningKeys = openIdConfig.SigningKeys,
                ClockSkew = TimeSpan.FromMinutes(2)
            };

            var principal = handler.ValidateToken(accessToken, validationParameters, out _);
            var mapped = MapPrincipal(principal);
            return mapped == null
                ? TrustedTokenValidationResult.Invalid()
                : TrustedTokenValidationResult.Success(mapped);
        }
        catch (SecurityTokenException)
        {
            return TrustedTokenValidationResult.Invalid();
        }
        catch (Exception ex) when (ex is ArgumentException or InvalidOperationException)
        {
            return TrustedTokenValidationResult.Invalid();
        }
    }

    private TrustedTokenPrincipal? MapPrincipal(ClaimsPrincipal principal)
    {
        var tid = FindClaim(
            principal,
            "tid",
            "tenantId",
            "http://schemas.microsoft.com/identity/claims/tenantid");
        if (!string.Equals(tid, _tenantId, StringComparison.OrdinalIgnoreCase))
            return null;

        var callingAppId = FindClaim(
            principal,
            "azp",
            "appid",
            "http://schemas.microsoft.com/identity/claims/authorizedparty",
            "http://schemas.microsoft.com/identity/claims/clientappid");
        if (string.IsNullOrWhiteSpace(callingAppId)
            || !_trustedClientIds.Contains(callingAppId))
            return null;

        var oid = FindClaim(
            principal,
            "oid",
            "sub",
            ClaimTypes.NameIdentifier,
            "http://schemas.microsoft.com/identity/claims/objectidentifier");
        if (string.IsNullOrWhiteSpace(oid))
            return null;

        var email = FindClaim(
            principal,
            "preferred_username",
            "email",
            "upn",
            ClaimTypes.Email,
            "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/upn")
            ?? "";
        var name = FindClaim(principal, "name", ClaimTypes.Name) ?? email;

        return new TrustedTokenPrincipal(oid, email, name, callingAppId);
    }

    private static string? FindClaim(ClaimsPrincipal principal, params string[] types)
    {
        foreach (var type in types)
        {
            var value = principal.FindFirst(type)?.Value;
            if (!string.IsNullOrWhiteSpace(value))
                return value;
        }

        return null;
    }
}
