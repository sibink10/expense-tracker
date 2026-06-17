namespace QubiqonFinanceHub.API.Auth.Shared;

/// <summary>
/// Trusted App B registrations allowed to call POST /api/auth/exchange.
/// Each App B API app registration must have manifest "accessTokenAcceptedVersion": 2
/// and expose scope api://{ClientId}/access_as_user so MSAL returns a JWT access token.
/// </summary>
public class TrustedAppsOptions
{
    public const string SectionName = "TrustedApps";

    public string? TenantId { get; set; }
    public TrustedAppEntry[] Apps { get; set; } = [];
}

public class TrustedAppEntry
{
    public string ClientId { get; set; } = "";
    public string Name { get; set; } = "";
}
