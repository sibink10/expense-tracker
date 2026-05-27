using System.Globalization;
using System.Net;
using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using QubiqonFinanceHub.API.Data;
using QubiqonFinanceHub.API.Models.Entities;
using QubiqonFinanceHub.API.Models.Enums;
using QubiqonFinanceHub.API.Models.Zoho;
using QubiqonFinanceHub.API.Services.Interfaces;
using QubiqonFinanceHub.API.Services.Pdf;

namespace QubiqonFinanceHub.API.Services.Zoho;

public class ZohoService : IZohoService
{
    private static readonly IReadOnlyDictionary<string, string> EmptyFieldTextData =
        new Dictionary<string, string>();

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly ZohoOptions _options;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IServiceScopeFactory _serviceScopeFactory;
    private readonly ITenantService _tenantService;
    private readonly ILogger<ZohoService> _logger;

    private readonly SemaphoreSlim _tokenGate = new(1, 1);
    private string? _cachedAccessToken;
    private string? _cachedAccessTokenKey;
    private DateTime _accessTokenExpiryUtc = DateTime.MinValue;

    public ZohoService(
        IOptions<ZohoOptions> options,
        IHttpClientFactory httpClientFactory,
        IServiceScopeFactory serviceScopeFactory,
        ITenantService tenantService,
        ILogger<ZohoService> logger)
    {
        _options = options?.Value ?? throw new ArgumentNullException(nameof(options));
        _httpClientFactory = httpClientFactory ?? throw new ArgumentNullException(nameof(httpClientFactory));
        _serviceScopeFactory = serviceScopeFactory ?? throw new ArgumentNullException(nameof(serviceScopeFactory));
        _tenantService = tenantService ?? throw new ArgumentNullException(nameof(tenantService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public string GetAuthorizationUrl()
    {
        var options = GetOptionsForCurrentOrganizationAsync(CancellationToken.None).GetAwaiter().GetResult();
        return BuildAuthorizationUrl(options);
    }

    public async Task<string> GetAuthorizationUrlAsync(Guid? organizationId = null, CancellationToken cancellationToken = default)
    {
        var options = organizationId.HasValue
            ? await GetOptionsForOrganizationAsync(organizationId.Value, cancellationToken)
            : await GetOptionsForCurrentOrganizationAsync(cancellationToken);

        return BuildAuthorizationUrl(options, organizationId ?? await GetConfiguredOrganizationIdAsync(cancellationToken));
    }

    private string BuildAuthorizationUrl(ZohoOptions options, Guid? organizationId = null)
    {
        if (string.IsNullOrWhiteSpace(options.ClientId) || string.IsNullOrWhiteSpace(options.RedirectUri))
            throw new InvalidOperationException("Zoho ClientId and RedirectUri must be configured.");

        var scope = string.IsNullOrWhiteSpace(options.Scope) ? ZohoOptions.DefaultScope : options.Scope.Trim();
        var query = new List<KeyValuePair<string, string?>>
        {
            new("response_type", "code"),
            new("client_id", options.ClientId.Trim()),
            new("scope", scope),
            new("redirect_uri", options.RedirectUri.Trim()),
            new("access_type", "offline"),
            new("prompt", "consent")
        };

        var state = organizationId?.ToString("D") ?? options.OAuthState;
        if (!string.IsNullOrWhiteSpace(state))
            query.Add(new KeyValuePair<string, string?>("state", state.Trim()));

        return QueryHelpers.AddQueryString(options.AuthorizationEndpoint.Trim(), query);
    }

    public bool IsValidOAuthState(string? stateFromCallback)
    {
        if (Guid.TryParse(stateFromCallback, out _))
            return true;

        var options = GetOptionsForCurrentOrganizationAsync(CancellationToken.None).GetAwaiter().GetResult();
        if (string.IsNullOrWhiteSpace(options.OAuthState))
            return true;
        return string.Equals(stateFromCallback?.Trim(), options.OAuthState.Trim(), StringComparison.Ordinal);
    }

    public async Task<ZohoIntegrationSetupDto> GetIntegrationSetupAsync(CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var options = await GetOptionsForCurrentOrganizationAsync(cancellationToken);
        var refreshToken = RefreshTokenFromConfig(options);
        var isConfigured =
            !string.IsNullOrWhiteSpace(options.ClientId) &&
            !string.IsNullOrWhiteSpace(options.ClientSecret) &&
            refreshToken != null;

        string? accessToken = null;
        string? tokenError = null;

        if (isConfigured)
        {
            try
            {
                accessToken = await GetAccessTokenAsync(cancellationToken);
            }
            catch (Exception ex)
            {
                tokenError = ex.Message;
            }
        }

        string? authorizationUrl = null;
        if (!string.IsNullOrWhiteSpace(options.ClientId) && !string.IsNullOrWhiteSpace(options.RedirectUri))
        {
            try { authorizationUrl = BuildAuthorizationUrl(options); }
            catch (InvalidOperationException ex) { _logger.LogDebug(ex, "Could not build Zoho authorization URL."); }
        }

        return new ZohoIntegrationSetupDto
        {
            ClientId = TrimOrNull(options.ClientId),
            Scope = string.IsNullOrWhiteSpace(options.Scope) ? ZohoOptions.DefaultScope : options.Scope.Trim(),
            IsConfigured = isConfigured,
            AccessToken = accessToken,
            TokenError = tokenError,
            AuthorizationUrl = authorizationUrl,
            DataCenter = string.IsNullOrWhiteSpace(options.DataCenter) ? "IN" : options.DataCenter.Trim(),
            HomePage = string.IsNullOrWhiteSpace(options.HomePage) ? null : options.HomePage.Trim()
        };
    }

    public async Task<string> GetAccessTokenAsync(CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var options = await GetOptionsForCurrentOrganizationAsync(cancellationToken);
        var refreshToken = RefreshTokenFromConfig(options);
        if (string.IsNullOrWhiteSpace(options.ClientId) ||
            string.IsNullOrWhiteSpace(options.ClientSecret) ||
            refreshToken == null)
        {
            throw new InvalidOperationException(
                "Set Zoho ClientId, ClientSecret, and RefreshToken (or legacy Code) under Admin → Organization profile.");
        }

        var accessTokenKey = BuildAccessTokenCacheKey(options);
        if (_cachedAccessToken != null &&
            string.Equals(_cachedAccessTokenKey, accessTokenKey, StringComparison.Ordinal) &&
            DateTime.UtcNow < _accessTokenExpiryUtc.AddMinutes(-5))
            return _cachedAccessToken;

        await _tokenGate.WaitAsync(cancellationToken);
        try
        {
            if (_cachedAccessToken != null &&
                string.Equals(_cachedAccessTokenKey, accessTokenKey, StringComparison.Ordinal) &&
                DateTime.UtcNow < _accessTokenExpiryUtc.AddMinutes(-5))
                return _cachedAccessToken;

            var result = await RequestAccessTokenFromRefreshTokenAsync(options, cancellationToken);
            if (!result.Success || result.Tokens?.AccessToken == null)
                throw new InvalidOperationException(result.RawBody ?? "Zoho token refresh failed.");

            var expiresSeconds = result.Tokens.ExpiresIn is > 0 ? result.Tokens.ExpiresIn.Value : 3600;
            _cachedAccessToken = result.Tokens.AccessToken;
            _cachedAccessTokenKey = accessTokenKey;
            _accessTokenExpiryUtc = DateTime.UtcNow.AddSeconds(expiresSeconds);
            return _cachedAccessToken;
        }
        finally
        {
            _tokenGate.Release();
        }
    }

    public async Task<ZohoTokenResponseDto> ExchangeAuthorizationCodeAsync(string code, CancellationToken cancellationToken = default)
        => await ExchangeAuthorizationCodeAsync(code, state: null, cancellationToken);

    public async Task<ZohoTokenResponseDto> ExchangeAuthorizationCodeAsync(
        string code,
        string? state,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(code))
            throw new ArgumentException("Authorization code is required.", nameof(code));

        var options = await GetOptionsForOAuthCallbackAsync(state, cancellationToken);
        if (string.IsNullOrWhiteSpace(options.ClientId) ||
            string.IsNullOrWhiteSpace(options.ClientSecret) ||
            string.IsNullOrWhiteSpace(options.RedirectUri))
        {
            throw new InvalidOperationException("ClientId, ClientSecret, and RedirectUri must be configured.");
        }

        var form = new Dictionary<string, string>
        {
            ["client_id"] = options.ClientId.Trim(),
            ["client_secret"] = options.ClientSecret.Trim(),
            ["grant_type"] = "authorization_code",
            ["code"] = code.Trim(),
            ["redirect_uri"] = options.RedirectUri.Trim()
        };

        using var content = new FormUrlEncodedContent(form);
        var client = _httpClientFactory.CreateClient();
        using var response = await client.PostAsync(options.TokenEndpoint.Trim(), content, cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);

        if (TryReadOAuthErrorPayload(body, out _) || !response.IsSuccessStatusCode)
            throw CreateOAuthExceptionFromFailureBody(body, response.IsSuccessStatusCode ? HttpStatusCode.BadRequest : response.StatusCode);

        ZohoTokenResponseDto? tokens;
        try
        {
            tokens = JsonSerializer.Deserialize<ZohoTokenResponseDto>(body, JsonOptions);
        }
        catch (JsonException ex)
        {
            throw new ZohoOAuthException("Zoho token response was not valid JSON.", rawBody: body, innerException: ex, statusCode: HttpStatusCode.BadGateway);
        }

        if (tokens == null)
            throw new ZohoOAuthException("Empty token response from Zoho.", rawBody: body, statusCode: HttpStatusCode.BadGateway);

        if (string.IsNullOrWhiteSpace(tokens.RefreshToken))
        {
            throw new ZohoOAuthException(
                "Refresh token was not returned. Use access_type=offline and prompt=consent with a fresh authorization.",
                "missing_refresh_token",
                rawBody: body);
        }

        return tokens;
    }

    public async Task<ZohoSignSendDocumentResultDto> SendDocumentForSignatureAsync(
        ZohoSignDocumentType type,
        Guid sourceId,
        string templateId,
        string? notes = null,
        CancellationToken cancellationToken = default)
    {
        if (sourceId == Guid.Empty)
            throw new ArgumentException("Source id is required.", nameof(sourceId));

        if (type == ZohoSignDocumentType.Invoice)
            return await SendInvoicePdfForSignatureAsync(sourceId, notes, cancellationToken);

        if (string.IsNullOrWhiteSpace(templateId))
            throw new ArgumentException("Template id is required.", nameof(templateId));

        using var scope = _serviceScopeFactory.CreateScope();
        var fieldData = await ZohoSignFieldDataBuilder.BuildAsync(
            type, sourceId, scope.ServiceProvider, cancellationToken);

        var templateIdTrimmed = templateId.Trim();
        var (actionId, role) = await GetFirstSignerActionFromTemplateAsync(templateIdTrimmed, cancellationToken);

        return await SendDocumentFromTemplateWithResolvedActionAsync(
            templateIdTrimmed,
            fieldData.SignerEmail,
            fieldData.SignerName,
            fieldData.FieldTextData,
            notes,
            actionId,
            role,
            cancellationToken,
            fieldData.FieldDateData);
    }

    private async Task<ZohoSignSendDocumentResultDto> SendInvoicePdfForSignatureAsync(
        Guid invoiceId,
        string? notes,
        CancellationToken cancellationToken)
    {
        using var scope = _serviceScopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<FinanceHubDbContext>();
        var pdfGenerator = scope.ServiceProvider.GetRequiredService<IInvoicePdfGenerator>();
        var invoiceService = scope.ServiceProvider.GetRequiredService<IInvoiceService>();

        var inv = await db.Invoices.AsNoTracking()
            .Include(x => x.Client)
            .FirstOrDefaultAsync(x => x.Id == invoiceId, cancellationToken)
            ?? throw new InvalidOperationException("Invoice not found.");

        var org = await db.Organizations.AsNoTracking()
            .FirstOrDefaultAsync(o => o.Id == inv.OrganizationId, cancellationToken)
            ?? throw new InvalidOperationException("Organization not found.");

        var signerEmail = org.ZohoSignEmail?.Trim();
        if (string.IsNullOrWhiteSpace(signerEmail))
            throw new InvalidOperationException(
                "Organization Zoho Sign email is not configured. Set it under Admin → Organization profile.");

        var signerName = string.IsNullOrWhiteSpace(org.SubName) ? org.OrgName : org.SubName!;
        var pdfBytes = await pdfGenerator.GenerateAsync(invoiceId, cancellationToken);

        var createBody = await PostSignCreateRequestAsync(
            inv.InvoiceCode,
            signerEmail,
            signerName,
            pdfBytes,
            $"{inv.InvoiceCode}.pdf",
            notes,
            cancellationToken);

        var parsed = ParseZohoSignCreateResponse(createBody);
        if (string.IsNullOrWhiteSpace(parsed.RequestId))
            throw new InvalidOperationException($"Zoho Sign did not return a request_id. Response: {createBody}");

        if (!TryParseCreatedRequestIds(createBody, out var actionId, out var documentId))
            throw new InvalidOperationException("Could not read action_id and document_id from Zoho create response.");

        await PutSignRequestFieldsAsync(
            parsed.RequestId!, actionId, documentId, signerEmail, signerName, cancellationToken);
        await PostSignRequestSubmitAsync(parsed.RequestId!, cancellationToken);

        var zohoStatus = TryReadRequestStatusFromBody(createBody) ?? "inprogress";
        await invoiceService.TransitionToPendingSignatureAsync(invoiceId, parsed.RequestId!, zohoStatus);

        return new ZohoSignSendDocumentResultDto
        {
            Code = parsed.Code,
            Message = parsed.Message ?? "Document sent for signature.",
            RequestId = parsed.RequestId,
            RawJson = parsed.RawJson
        };
    }

    public string MapZohoRequestStatusToInvoiceStatus(string? zohoStatus)
    {
        if (string.IsNullOrWhiteSpace(zohoStatus)) return nameof(InvoiceStatus.PendingSignature);
        var s = zohoStatus.Trim().ToLowerInvariant();
        return s switch
        {
            "completed" or "signed" => nameof(InvoiceStatus.Signed),
            "declined" or "expired" or "recalled" or "rejected" or "failed" => nameof(InvoiceStatus.SignatureFailed),
            _ => nameof(InvoiceStatus.PendingSignature)
        };
    }

    public async Task HandleSignWebhookAsync(JsonNode payload, CancellationToken cancellationToken = default)
    {
        var requestId = TryReadWebhookRequestId(payload);
        if (string.IsNullOrWhiteSpace(requestId)) return;

        var zohoStatus = TryReadWebhookStatus(payload) ?? "completed";
        using var scope = _serviceScopeFactory.CreateScope();
        var invoiceService = scope.ServiceProvider.GetRequiredService<IInvoiceService>();

        try
        {
            await invoiceService.ApplyZohoSignStatusByRequestIdAsync(requestId, zohoStatus);
        }
        catch (KeyNotFoundException)
        {
            _logger.LogWarning("Zoho webhook: no invoice for request_id {RequestId}", requestId);
            return;
        }

        var mapped = MapZohoRequestStatusToInvoiceStatus(zohoStatus);
        if (mapped == nameof(InvoiceStatus.Signed))
            await invoiceService.TrySyncSignedPdfByRequestIdAsync(requestId);
    }

    public Task<ZohoSignSendDocumentResultDto> SendDocumentFromTemplateAsync(
        string templateId,
        string signerEmail,
        string signerName,
        string? notes = null,
        CancellationToken cancellationToken = default) =>
        SendDocumentFromTemplateAsync(templateId, signerEmail, signerName, EmptyFieldTextData, notes, cancellationToken);

    public async Task<ZohoSignSendDocumentResultDto> SendDocumentFromTemplateAsync(
        string templateId,
        string signerEmail,
        string signerName,
        IReadOnlyDictionary<string, string> fieldTextData,
        string? notes = null,
        CancellationToken cancellationToken = default)
    {
        ValidateSendDocumentFromTemplateArguments(templateId, signerEmail, signerName);
        ArgumentNullException.ThrowIfNull(fieldTextData);

        var templateIdTrimmed = templateId.Trim();
        var (actionId, role) = await GetFirstSignerActionFromTemplateAsync(templateIdTrimmed, cancellationToken);
        return await SendDocumentFromTemplateWithResolvedActionAsync(
            templateIdTrimmed, signerEmail, signerName, fieldTextData, notes, actionId, role, cancellationToken);
    }

    public Task<JsonNode> GetSignTemplatesAsync(CancellationToken cancellationToken = default) =>
        SendSignApiGetJsonAsync("/api/v1/templates", cancellationToken);

    public Task<JsonNode> GetSignTemplateByIdAsync(string templateId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(templateId))
            throw new ArgumentException("Template id is required.", nameof(templateId));
        return SendSignApiGetJsonAsync($"/api/v1/templates/{Uri.EscapeDataString(templateId.Trim())}", cancellationToken);
    }

    public Task<JsonNode> GetSignRequestsAsync(ZohoSignRequestsListQueryDto query, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(query);

        var rowCount = query.RowCount <= 0 ? 10 : Math.Min(query.RowCount, 100);
        var startIndex = query.StartIndex <= 0 ? 1 : query.StartIndex;
        var sortColumn = string.IsNullOrWhiteSpace(query.SortColumn) ? "created_time" : query.SortColumn.Trim();
        var sortOrder = string.IsNullOrWhiteSpace(query.SortOrder) ? "DESC" : query.SortOrder.Trim().ToUpperInvariant();
        if (sortOrder is not ("ASC" or "DESC")) sortOrder = "DESC";

        var pageContext = new JsonObject
        {
            ["row_count"] = rowCount,
            ["start_index"] = startIndex,
            ["sort_column"] = sortColumn,
            ["sort_order"] = sortOrder
        };

        if (!string.IsNullOrWhiteSpace(query.TemplateName))
            pageContext["search_columns"] = new JsonObject { ["template_name"] = query.TemplateName.Trim() };

        var dataJson = new JsonObject { ["page_context"] = pageContext }.ToJsonString();
        return SendSignApiGetJsonAsync($"/api/v1/requests?data={Uri.EscapeDataString(dataJson)}", cancellationToken);
    }

    public Task<JsonNode> GetSignRequestByIdAsync(string requestId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(requestId))
            throw new ArgumentException("Request id is required.", nameof(requestId));
        return SendSignApiGetJsonAsync($"/api/v1/requests/{Uri.EscapeDataString(requestId.Trim())}", cancellationToken);
    }

    public Task<byte[]> DownloadSignRequestPdfAsync(
        string requestId,
        bool withCoc = false,
        bool merge = true,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(requestId))
            throw new ArgumentException("Request id is required.", nameof(requestId));

        var pathAndQuery = QueryHelpers.AddQueryString(
            $"/api/v1/requests/{Uri.EscapeDataString(requestId.Trim())}/pdf",
            new Dictionary<string, string?>
            {
                ["with_coc"] = withCoc ? "true" : "false",
                ["merge"] = merge ? "true" : "false"
            });
        return SendSignApiGetBytesAsync(pathAndQuery, cancellationToken);
    }

    private async Task<ZohoAuthorizationCodeExchangeResult> RequestAccessTokenFromRefreshTokenAsync(
        ZohoOptions options,
        CancellationToken cancellationToken)
    {
        var form = new Dictionary<string, string>
        {
            ["client_id"] = options.ClientId.Trim(),
            ["client_secret"] = options.ClientSecret.Trim(),
            ["grant_type"] = "refresh_token",
            ["refresh_token"] = RefreshTokenFromConfig(options)!
        };

        using var content = new FormUrlEncodedContent(form);
        var client = _httpClientFactory.CreateClient();
        using var response = await client.PostAsync(options.TokenEndpoint.Trim(), content, cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
            return new ZohoAuthorizationCodeExchangeResult { Success = false, StatusCode = response.StatusCode, RawBody = body };

        ZohoTokenResponseDto? tokens;
        try
        {
            tokens = JsonSerializer.Deserialize<ZohoTokenResponseDto>(body, JsonOptions);
        }
        catch (JsonException)
        {
            return new ZohoAuthorizationCodeExchangeResult { Success = false, StatusCode = response.StatusCode, RawBody = body };
        }

        if (tokens?.AccessToken == null)
            return new ZohoAuthorizationCodeExchangeResult { Success = false, StatusCode = response.StatusCode, RawBody = body };

        return new ZohoAuthorizationCodeExchangeResult { Success = true, StatusCode = response.StatusCode, Tokens = tokens };
    }

    private async Task<JsonNode> SendSignApiGetJsonAsync(string path, CancellationToken cancellationToken)
    {
        var options = await GetOptionsForCurrentOrganizationAsync(cancellationToken);
        var accessToken = await GetAccessTokenAsync(cancellationToken);
        var url = $"{options.SignApiBaseUrl.Trim().TrimEnd('/')}{path}";

        var client = _httpClientFactory.CreateClient();
        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.TryAddWithoutValidation("Authorization", $"Zoho-oauthtoken {accessToken}");

        using var response = await client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var detail = $"Zoho Sign API failed ({(int)response.StatusCode}): {body}";
            if (body.Contains("\"code\":9040", StringComparison.Ordinal) ||
                body.Contains("Invalid Oauth Scope", StringComparison.OrdinalIgnoreCase))
            {
                detail += " Re-authorize with scopes: " + ZohoOptions.DefaultScope;
            }
            throw new InvalidOperationException(detail);
        }

        return JsonNode.Parse(body) ?? throw new InvalidOperationException("Zoho Sign API returned empty JSON.");
    }

    private async Task<byte[]> SendSignApiGetBytesAsync(string path, CancellationToken cancellationToken)
    {
        var options = await GetOptionsForCurrentOrganizationAsync(cancellationToken);
        var accessToken = await GetAccessTokenAsync(cancellationToken);
        var url = $"{options.SignApiBaseUrl.Trim().TrimEnd('/')}{path}";

        var client = _httpClientFactory.CreateClient();
        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.TryAddWithoutValidation("Authorization", $"Zoho-oauthtoken {accessToken}");

        using var response = await client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync(cancellationToken);
            throw new InvalidOperationException($"Zoho Sign API failed ({(int)response.StatusCode}): {body}");
        }

        return await response.Content.ReadAsByteArrayAsync(cancellationToken);
    }

    private async Task<ZohoSignSendDocumentResultDto> SendDocumentFromTemplateWithResolvedActionAsync(
        string templateIdTrimmed,
        string signerEmail,
        string signerName,
        IReadOnlyDictionary<string, string> fieldTextData,
        string? notes,
        string actionId,
        string role,
        CancellationToken cancellationToken,
        IReadOnlyDictionary<string, string>? fieldDateData = null)
    {
        var dataJson = BuildCreatedocumentFormDataJson(signerEmail, signerName, notes, fieldTextData, actionId, role, fieldDateData);
        var responseBody = await PostSignCreatedocumentAsync(templateIdTrimmed, dataJson, cancellationToken);
        return ParseZohoSignCreateResponse(responseBody);
    }

    private async Task<(string ActionId, string Role)> GetFirstSignerActionFromTemplateAsync(
        string templateId,
        CancellationToken cancellationToken)
    {
        var detail = await GetSignTemplateByIdAsync(templateId, cancellationToken);
        if (TryGetFirstSignerAction(detail, out var actionId, out var role))
            return (actionId, role);

        throw new InvalidOperationException(
            "Could not read actions[0].action_id from the Zoho Sign template.");
    }

    private static bool TryGetFirstSignerAction(JsonNode detail, out string actionId, out string role)
    {
        actionId = "";
        role = "Signer";

        JsonObject? templates = detail switch
        {
            JsonObject o when o["templates"] is JsonObject t => t,
            JsonObject o when o["data"] is JsonObject d && d["templates"] is JsonObject t2 => t2,
            _ => null
        };

        if (templates?["actions"] is not JsonArray actions || actions.Count == 0 || actions[0] is not JsonObject first)
            return false;

        var rawId = first["action_id"];
        if (rawId is JsonValue jv && jv.TryGetValue<string>(out var s) && !string.IsNullOrWhiteSpace(s))
            actionId = s.Trim();
        else
        {
            var t = rawId?.ToString().Trim().Trim('"');
            if (string.IsNullOrWhiteSpace(t)) return false;
            actionId = t;
        }

        var rawRole = first["role"];
        if (rawRole is JsonValue rv && rv.TryGetValue<string>(out var rs) && !string.IsNullOrWhiteSpace(rs))
            role = rs.Trim();

        return true;
    }

    private static void ValidateSendDocumentFromTemplateArguments(string templateId, string signerEmail, string signerName)
    {
        if (string.IsNullOrWhiteSpace(templateId))
            throw new ArgumentException("Template id is required.", nameof(templateId));
        if (string.IsNullOrWhiteSpace(signerEmail))
            throw new ArgumentException("Signer email is required.", nameof(signerEmail));
        if (string.IsNullOrWhiteSpace(signerName))
            throw new ArgumentException("Signer name is required.", nameof(signerName));
    }

    private static string BuildCreatedocumentFormDataJson(
        string signerEmail,
        string signerName,
        string? notes,
        IReadOnlyDictionary<string, string> fieldTextData,
        string actionId,
        string role,
        IReadOnlyDictionary<string, string>? fieldDateData = null)
    {
        var fieldText = new JsonObject();
        foreach (var kv in fieldTextData)
            fieldText[kv.Key] = string.IsNullOrWhiteSpace(kv.Value) ? "NA" : kv.Value.Trim();

        var fieldData = new JsonObject { ["field_text_data"] = fieldText };

        if (fieldDateData != null && fieldDateData.Count > 0)
        {
            var fieldDate = new JsonObject();
            foreach (var kv in fieldDateData)
            {
                if (!string.IsNullOrWhiteSpace(kv.Value))
                    fieldDate[kv.Key] = kv.Value.Trim();
            }
            if (fieldDate.Count > 0)
                fieldData["field_date_data"] = fieldDate;
        }

        var templatesObj = new JsonObject
        {
            ["field_data"] = fieldData,
            ["actions"] = new JsonArray
            {
                new JsonObject
                {
                    ["action_id"] = actionId.Trim(),
                    ["recipient_email"] = signerEmail.Trim(),
                    ["recipient_name"] = signerName.Trim(),
                    ["role"] = string.IsNullOrWhiteSpace(role) ? "Signer" : role.Trim()
                }
            }
        };

        if (!string.IsNullOrWhiteSpace(notes))
            templatesObj["notes"] = notes.Trim();

        return new JsonObject { ["templates"] = templatesObj }.ToJsonString();
    }

    private async Task<string> PostSignCreatedocumentAsync(string templateId, string dataJson, CancellationToken cancellationToken)
    {
        var options = await GetOptionsForCurrentOrganizationAsync(cancellationToken);
        var accessToken = await GetAccessTokenAsync(cancellationToken);
        var url = $"{options.SignApiBaseUrl.Trim().TrimEnd('/')}/api/v1/templates/{Uri.EscapeDataString(templateId)}/createdocument?is_quicksend=true";

        using var form = new MultipartFormDataContent();
        form.Add(new StringContent(dataJson, System.Text.Encoding.UTF8), "data");
        form.Add(new StringContent("true", System.Text.Encoding.UTF8), "is_quicksend");

        var client = _httpClientFactory.CreateClient();
        using var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.TryAddWithoutValidation("Authorization", $"Zoho-oauthtoken {accessToken}");
        request.Content = form;

        using var response = await client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
            throw new InvalidOperationException($"Zoho Sign API failed ({(int)response.StatusCode}): {body}");

        return body;
    }

    private static ZohoSignSendDocumentResultDto ParseZohoSignCreateResponse(string body)
    {
        int? code = null;
        string? message = null;
        string? requestId = null;

        try
        {
            using var doc = JsonDocument.Parse(body);
            var root = doc.RootElement;
            if (root.TryGetProperty("code", out var c) && c.ValueKind == JsonValueKind.Number)
                code = c.GetInt32();
            if (root.TryGetProperty("message", out var m) && m.ValueKind == JsonValueKind.String)
                message = m.GetString();
            if (root.TryGetProperty("requests", out var req) && req.ValueKind == JsonValueKind.Object &&
                req.TryGetProperty("request_id", out var rid) && rid.ValueKind == JsonValueKind.String)
            {
                requestId = rid.GetString();
            }
        }
        catch (JsonException) { /* raw_json still returned */ }

        return new ZohoSignSendDocumentResultDto
        {
            Code = code,
            Message = message,
            RequestId = requestId,
            RawJson = body
        };
    }

    private static bool TryReadOAuthErrorPayload(string body, out ZohoOAuthErrorResponseDto? oauthError)
    {
        oauthError = null;
        if (string.IsNullOrWhiteSpace(body)) return false;
        try
        {
            oauthError = JsonSerializer.Deserialize<ZohoOAuthErrorResponseDto>(body, JsonOptions);
            return oauthError != null && !string.IsNullOrWhiteSpace(oauthError.Error);
        }
        catch (JsonException)
        {
            return false;
        }
    }

    private static ZohoOAuthException CreateOAuthExceptionFromFailureBody(string body, HttpStatusCode statusCode)
    {
        ZohoOAuthErrorResponseDto? err = null;
        try { err = JsonSerializer.Deserialize<ZohoOAuthErrorResponseDto>(body, JsonOptions); }
        catch (JsonException) { /* ignore */ }

        var code = err?.Error?.Trim();
        var desc = err?.ErrorDescription?.Trim();
        var message = !string.IsNullOrWhiteSpace(desc) && string.IsNullOrWhiteSpace(code)
            ? desc!
            : code switch
            {
                "invalid_code" => desc ?? "The authorization code is invalid or already used.",
                "invalid_grant" => desc ?? "The grant is invalid or expired.",
                _ when !string.IsNullOrWhiteSpace(code) => string.IsNullOrWhiteSpace(desc) ? $"Zoho OAuth error: {code}" : $"{code}: {desc}",
                _ => string.IsNullOrWhiteSpace(body) ? "Zoho token exchange failed." : $"Zoho token exchange failed: {body}"
            };

        return new ZohoOAuthException(message, code, desc, statusCode, body);
    }

    private string? RefreshTokenFromConfig(ZohoOptions options)
    {
        if (!string.IsNullOrWhiteSpace(options.RefreshToken)) return options.RefreshToken.Trim();
        if (!string.IsNullOrWhiteSpace(options.Code)) return options.Code.Trim();
        return null;
    }

    private static string? TrimOrNull(string? s) => string.IsNullOrWhiteSpace(s) ? null : s.Trim();

    private static string BuildAccessTokenCacheKey(ZohoOptions options) =>
        string.Join("|", options.ClientId.Trim(), options.TokenEndpoint.Trim(), RefreshTokenFromOptions(options));

    private static string RefreshTokenFromOptions(ZohoOptions options) =>
        !string.IsNullOrWhiteSpace(options.RefreshToken) ? options.RefreshToken.Trim() : options.Code.Trim();

    private async Task<ZohoOptions> GetOptionsForCurrentOrganizationAsync(CancellationToken cancellationToken)
    {
        try
        {
            var orgId = await _tenantService.GetEffectiveOrganizationIdAsync();
            return await GetOptionsForOrganizationAsync(orgId, cancellationToken);
        }
        catch
        {
            return await GetOptionsForConfiguredOrganizationAsync(cancellationToken);
        }
    }

    private async Task<ZohoOptions> GetOptionsForOAuthCallbackAsync(string? state, CancellationToken cancellationToken)
    {
        if (Guid.TryParse(state, out var organizationId))
            return await GetOptionsForOrganizationAsync(organizationId, cancellationToken);

        return await GetOptionsForConfiguredOrganizationAsync(cancellationToken);
    }

    private async Task<Guid?> GetConfiguredOrganizationIdAsync(CancellationToken cancellationToken)
    {
        using var scope = _serviceScopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<FinanceHubDbContext>();
        return await db.Organizations.AsNoTracking()
            .Where(o => o.IsActive &&
                !string.IsNullOrWhiteSpace(o.ZohoClientId) &&
                !string.IsNullOrWhiteSpace(o.ZohoRedirectUri))
            .OrderBy(o => o.OrgName)
            .Select(o => (Guid?)o.Id)
            .FirstOrDefaultAsync(cancellationToken);
    }

    private async Task<ZohoOptions> GetOptionsForConfiguredOrganizationAsync(CancellationToken cancellationToken)
    {
        using var scope = _serviceScopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<FinanceHubDbContext>();
        var org = await db.Organizations.AsNoTracking()
            .Where(o => o.IsActive &&
                !string.IsNullOrWhiteSpace(o.ZohoClientId) &&
                !string.IsNullOrWhiteSpace(o.ZohoRedirectUri))
            .OrderBy(o => o.OrgName)
            .FirstOrDefaultAsync(cancellationToken);

        return org == null ? _options : MapOptions(org);
    }

    private async Task<ZohoOptions> GetOptionsForOrganizationAsync(Guid organizationId, CancellationToken cancellationToken)
    {
        using var scope = _serviceScopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<FinanceHubDbContext>();
        var org = await db.Organizations.AsNoTracking()
            .FirstOrDefaultAsync(o => o.Id == organizationId, cancellationToken);

        if (org == null) return _options;

        return MapOptions(org);
    }

    private ZohoOptions MapOptions(Organization org) =>
        new()
        {
            ClientId = TrimOrFallback(org.ZohoClientId, _options.ClientId),
            ClientSecret = TrimOrFallback(org.ZohoClientSecret, _options.ClientSecret),
            RefreshToken = TrimOrFallback(org.ZohoRefreshToken, _options.RefreshToken),
            Code = TrimOrFallback(org.ZohoCode, _options.Code),
            Scope = TrimOrFallback(org.ZohoScope, string.IsNullOrWhiteSpace(_options.Scope) ? ZohoOptions.DefaultScope : _options.Scope),
            DataCenter = TrimOrFallback(org.ZohoDataCenter, _options.DataCenter),
            HomePage = TrimOrFallback(org.ZohoHomePage, _options.HomePage),
            RedirectUri = TrimOrFallback(org.ZohoRedirectUri, _options.RedirectUri),
            OAuthState = _options.OAuthState,
            AuthorizationEndpoint = TrimOrFallback(org.ZohoAuthorizationEndpoint, _options.AuthorizationEndpoint),
            TokenEndpoint = TrimOrFallback(org.ZohoTokenEndpoint, _options.TokenEndpoint),
            SignApiBaseUrl = TrimOrFallback(org.ZohoSignApiBaseUrl, _options.SignApiBaseUrl)
        };

    private static string TrimOrFallback(string? value, string fallback) =>
        string.IsNullOrWhiteSpace(value) ? fallback : value.Trim();

    private async Task<string> PostSignCreateRequestAsync(
        string requestName,
        string signerEmail,
        string signerName,
        byte[] pdfBytes,
        string fileName,
        string? notes,
        CancellationToken cancellationToken)
    {
        var action = new JsonObject
        {
            ["recipient_name"] = signerName,
            ["recipient_email"] = signerEmail,
            ["action_type"] = "SIGN",
            ["signing_order"] = 0,
            ["verify_recipient"] = true,
            ["verification_type"] = "EMAIL"
        };

        var requestsObj = new JsonObject
        {
            ["request_name"] = requestName,
            ["is_sequential"] = true,
            ["expiration_days"] = 30,
            ["email_reminders"] = true,
            ["reminder_period"] = 5,
            ["actions"] = new JsonArray(action)
        };

        if (!string.IsNullOrWhiteSpace(notes))
            requestsObj["notes"] = notes.Trim();

        var dataJson = new JsonObject { ["requests"] = requestsObj }.ToJsonString();

        var options = await GetOptionsForCurrentOrganizationAsync(cancellationToken);
        var accessToken = await GetAccessTokenAsync(cancellationToken);
        var url = $"{options.SignApiBaseUrl.Trim().TrimEnd('/')}/api/v1/requests";

        using var form = new MultipartFormDataContent();
        form.Add(new StringContent(dataJson, System.Text.Encoding.UTF8), "data");
        form.Add(new ByteArrayContent(pdfBytes), "file", fileName);

        var client = _httpClientFactory.CreateClient();
        using var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.TryAddWithoutValidation("Authorization", $"Zoho-oauthtoken {accessToken}");
        request.Content = form;

        using var response = await client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
            throw new InvalidOperationException($"Zoho Sign create request failed ({(int)response.StatusCode}): {body}");

        return body;
    }

    private async Task PutSignRequestFieldsAsync(
        string requestId,
        string actionId,
        string documentId,
        string signerEmail,
        string signerName,
        CancellationToken cancellationToken)
    {
        // Zoho PUT /requests/{id} expects fields grouped under image_fields and x_coord/y_coord (not x_value/y_value).
        var signatureField = new JsonObject
        {
            ["field_name"] = "Signature",
            ["field_label"] = "Authorized Signature",
            ["field_type_name"] = "Signature",
            ["document_id"] = documentId,
            ["action_id"] = actionId,
            ["is_mandatory"] = true,
            ["x_coord"] = 419,
            ["y_coord"] = 760,
            ["abs_width"] = 115,
            ["abs_height"] = 20,
            ["page_no"] = 0,
            ["description_tooltip"] = "Authorized Signature"
        };

        var actionObj = new JsonObject
        {
            ["action_id"] = actionId,
            ["recipient_name"] = signerName,
            ["recipient_email"] = signerEmail,
            ["action_type"] = "SIGN",
            ["fields"] = new JsonObject
            {
                ["image_fields"] = new JsonArray(signatureField)
            }
        };

        var dataJson = new JsonObject
        {
            ["requests"] = new JsonObject { ["actions"] = new JsonArray(actionObj) }
        }.ToJsonString();

        var options = await GetOptionsForCurrentOrganizationAsync(cancellationToken);
        var accessToken = await GetAccessTokenAsync(cancellationToken);
        var url = $"{options.SignApiBaseUrl.Trim().TrimEnd('/')}/api/v1/requests/{Uri.EscapeDataString(requestId)}";

        using var form = new MultipartFormDataContent();
        form.Add(new StringContent(dataJson, System.Text.Encoding.UTF8), "data");

        var client = _httpClientFactory.CreateClient();
        using var request = new HttpRequestMessage(HttpMethod.Put, url);
        request.Headers.TryAddWithoutValidation("Authorization", $"Zoho-oauthtoken {accessToken}");
        request.Content = form;

        using var response = await client.SendAsync(request, cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
            throw new InvalidOperationException($"Zoho Sign update fields failed ({(int)response.StatusCode}): {body}");
    }

    private async Task PostSignRequestSubmitAsync(string requestId, CancellationToken cancellationToken)
    {
        var options = await GetOptionsForCurrentOrganizationAsync(cancellationToken);
        var accessToken = await GetAccessTokenAsync(cancellationToken);
        var url = $"{options.SignApiBaseUrl.Trim().TrimEnd('/')}/api/v1/requests/{Uri.EscapeDataString(requestId)}/submit";

        var client = _httpClientFactory.CreateClient();
        using var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.TryAddWithoutValidation("Authorization", $"Zoho-oauthtoken {accessToken}");

        using var response = await client.SendAsync(request, cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
            throw new InvalidOperationException($"Zoho Sign submit failed ({(int)response.StatusCode}): {body}");
    }

    private static bool TryParseCreatedRequestIds(string body, out string actionId, out string documentId)
    {
        actionId = "";
        documentId = "";
        try
        {
            using var doc = JsonDocument.Parse(body);
            if (!doc.RootElement.TryGetProperty("requests", out var req) || req.ValueKind != JsonValueKind.Object)
                return false;

            documentId = TryReadFirstDocumentId(req) ?? "";
            actionId = TryReadFirstActionId(req) ?? "";

            return !string.IsNullOrWhiteSpace(actionId) && !string.IsNullOrWhiteSpace(documentId);
        }
        catch (JsonException)
        {
            return false;
        }
    }

    private static string? TryReadFirstDocumentId(JsonElement requests)
    {
        if (requests.TryGetProperty("document_ids", out var docs) && docs.ValueKind == JsonValueKind.Array && docs.GetArrayLength() > 0)
        {
            var first = docs[0];
            if (first.ValueKind == JsonValueKind.String)
                return first.GetString();
            if (first.TryGetProperty("document_id", out var did))
                return ReadJsonStringOrNumber(did);
        }

        if (requests.TryGetProperty("documents", out var documents) && documents.ValueKind == JsonValueKind.Array && documents.GetArrayLength() > 0)
        {
            var first = documents[0];
            if (first.TryGetProperty("document_id", out var did))
                return ReadJsonStringOrNumber(did);
        }

        return null;
    }

    private static string? TryReadFirstActionId(JsonElement requests)
    {
        if (requests.TryGetProperty("actions", out var actions) && actions.ValueKind == JsonValueKind.Array && actions.GetArrayLength() > 0)
        {
            var first = actions[0];
            if (first.TryGetProperty("action_id", out var aid))
                return ReadJsonStringOrNumber(aid);
        }

        return null;
    }

    private static string? ReadJsonStringOrNumber(JsonElement el) =>
        el.ValueKind switch
        {
            JsonValueKind.String => el.GetString(),
            JsonValueKind.Number => el.GetRawText(),
            _ => el.ToString().Trim('"')
        };

    private static string? TryReadRequestStatusFromBody(string body)
    {
        try
        {
            using var doc = JsonDocument.Parse(body);
            if (doc.RootElement.TryGetProperty("requests", out var req) &&
                req.TryGetProperty("request_status", out var st))
                return st.GetString();
        }
        catch { /* ignore */ }
        return null;
    }

    private static string? TryReadWebhookRequestId(JsonNode payload)
    {
        if (payload["requests"] is JsonObject r && r["request_id"] is JsonValue rv && rv.TryGetValue<string>(out var id))
            return id;
        if (payload["request_id"] is JsonValue rv2 && rv2.TryGetValue<string>(out var id2))
            return id2;
        return payload["request_id"]?.ToString().Trim('"');
    }

    private static string? TryReadWebhookStatus(JsonNode payload)
    {
        if (payload["requests"] is JsonObject r && r["request_status"] is JsonValue rv && rv.TryGetValue<string>(out var s))
            return s;
        return payload["request_status"]?.ToString().Trim('"')
            ?? payload["action_status"]?.ToString().Trim('"');
    }
}
