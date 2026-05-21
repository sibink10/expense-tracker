namespace QubiqonFinanceHub.API.Models.Zoho;

public class ZohoIntegrationSetupDto
{
    public string Title { get; init; } = "Zoho integration setup";
    public string? ClientId { get; init; }
    public string? Scope { get; init; }
    public string? DataCenter { get; init; }
    public string? HomePage { get; init; }
    public bool IsConfigured { get; init; }
    public string? AccessToken { get; init; }
    public string? TokenError { get; init; }
    public string? AuthorizationUrl { get; init; }
}
