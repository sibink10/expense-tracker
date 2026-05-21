namespace QubiqonFinanceHub.API.Services.Zoho;

public class ZohoOptions
{
    public const string SectionName = "Zoho";

    public string ClientId { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;

    public const string DefaultScope =
        "ZohoSign.templates.CREATE,ZohoSign.templates.READ,ZohoSign.templates.UPDATE," +
        "ZohoSign.documents.CREATE,ZohoSign.documents.READ,ZohoSign.documents.UPDATE";

    public string Scope { get; set; } = DefaultScope;
    public string DataCenter { get; set; } = "IN";
    public string HomePage { get; set; } = string.Empty;
    public string RedirectUri { get; set; } = string.Empty;
    public string OAuthState { get; set; } = string.Empty;
    public string AuthorizationEndpoint { get; set; } = "https://accounts.zoho.in/oauth/v2/auth";
    public string TokenEndpoint { get; set; } = "https://accounts.zoho.in/oauth/v2/token";
    public string SignApiBaseUrl { get; set; } = "https://sign.zoho.in";
}
