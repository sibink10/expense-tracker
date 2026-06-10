namespace QubiqonFinanceHub.API.Auth.Shared;

public class GlobalAuthOptions
{
    public const string SectionName = "GlobalAuth";

    public string CookieName { get; set; } = "qubiqon_session";
    public string? CookieDomain { get; set; } = ".qubiqon.io";
    public int SessionLifetimeDays { get; set; } = 7;
    public string AppJwtSecret { get; set; } = "";
    public int AppJwtExpiryDays { get; set; } = 2;
    public string CallbackPath { get; set; } = "/api/auth/callback";
    public string OAuthRedirectUri { get; set; } = "";
    public string[] AllowedReturnHosts { get; set; } = [];
}
