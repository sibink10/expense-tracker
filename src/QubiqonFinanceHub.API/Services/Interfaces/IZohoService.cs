using System.Text.Json.Nodes;
using QubiqonFinanceHub.API.Models.Zoho;

namespace QubiqonFinanceHub.API.Services.Interfaces;

public interface IZohoService
{
    string GetAuthorizationUrl();
    bool IsValidOAuthState(string? stateFromCallback);
    Task<ZohoIntegrationSetupDto> GetIntegrationSetupAsync(CancellationToken cancellationToken = default);
    Task<string> GetAccessTokenAsync(CancellationToken cancellationToken = default);
    Task<ZohoTokenResponseDto> ExchangeAuthorizationCodeAsync(string code, CancellationToken cancellationToken = default);

    Task<ZohoSignSendDocumentResultDto> SendDocumentForSignatureAsync(
        ZohoSignDocumentType type,
        Guid sourceId,
        string templateId,
        string? notes = null,
        CancellationToken cancellationToken = default);

    Task<ZohoSignSendDocumentResultDto> SendDocumentFromTemplateAsync(
        string templateId,
        string signerEmail,
        string signerName,
        string? notes = null,
        CancellationToken cancellationToken = default);

    Task<ZohoSignSendDocumentResultDto> SendDocumentFromTemplateAsync(
        string templateId,
        string signerEmail,
        string signerName,
        IReadOnlyDictionary<string, string> fieldTextData,
        string? notes = null,
        CancellationToken cancellationToken = default);

    Task<JsonNode> GetSignTemplatesAsync(CancellationToken cancellationToken = default);
    Task<JsonNode> GetSignTemplateByIdAsync(string templateId, CancellationToken cancellationToken = default);
    Task<JsonNode> GetSignRequestsAsync(ZohoSignRequestsListQueryDto query, CancellationToken cancellationToken = default);
    Task<JsonNode> GetSignRequestByIdAsync(string requestId, CancellationToken cancellationToken = default);
    Task<byte[]> DownloadSignRequestPdfAsync(
        string requestId,
        bool withCoc = true,
        bool merge = true,
        CancellationToken cancellationToken = default);

    Task HandleSignWebhookAsync(JsonNode payload, CancellationToken cancellationToken = default);

    string MapZohoRequestStatusToInvoiceStatus(string? zohoStatus);
}
