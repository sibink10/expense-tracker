using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QubiqonFinanceHub.API.Models.Zoho;
using QubiqonFinanceHub.API.Services.Interfaces;

namespace QubiqonFinanceHub.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ZohoController : ControllerBase
{
    private readonly IZohoService _zohoService;

    public ZohoController(IZohoService zohoService)
    {
        _zohoService = zohoService;
    }

    [AllowAnonymous]
    [HttpGet("oauth/authorization-url")]
    public IActionResult GetAuthorizationUrl()
    {
        try
        {
            return Ok(new { authorization_url = _zohoService.GetAuthorizationUrl() });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // [Authorize(Roles = "Admin")]
    [HttpGet("integration-setup")]
    public async Task<IActionResult> GetIntegrationSetup(CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await _zohoService.GetIntegrationSetupAsync(cancellationToken));
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [AllowAnonymous]
    [HttpGet("/zoho/auth/callback")]
    public async Task<IActionResult> OAuthCallback(
        [FromQuery] string? code,
        [FromQuery] string? state,
        [FromQuery] string? error,
        [FromQuery] string? error_description,
        CancellationToken cancellationToken)
    {
        if (!string.IsNullOrEmpty(error))
        {
            return BadRequest(new ZohoOAuthErrorResponseDto
            {
                Error = error,
                ErrorDescription = error_description
            });
        }

        if (string.IsNullOrWhiteSpace(code))
            return BadRequest(new { message = "Missing required query parameter: code." });

        if (!_zohoService.IsValidOAuthState(state))
            return BadRequest(new { message = "Invalid or missing OAuth state." });

        try
        {
            var tokens = await _zohoService.ExchangeAuthorizationCodeAsync(code.Trim(), cancellationToken);
            return Ok(new
            {
                message = "Store refresh_token securely (User Secrets / Key Vault). Do not commit tokens.",
                state,
                access_token = tokens.AccessToken,
                refresh_token = tokens.RefreshToken,
                expires_in = tokens.ExpiresIn,
                token_type = tokens.TokenType,
                api_domain = tokens.ApiDomain
            });
        }
        catch (ZohoOAuthException ex)
        {
            return StatusCode((int)ex.StatusCode, new
            {
                error = ex.ZohoError ?? "token_exchange_failed",
                error_description = ex.Message,
                detail = ex.ZohoErrorDescription,
                raw = ex.RawBody
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [AllowAnonymous]
    [HttpPost("oauth/authorization-code")]
    public async Task<IActionResult> ExchangeAuthorizationCode(
        [FromBody] ZohoAuthorizationCodeExchangeRequestDto request,
        CancellationToken cancellationToken)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.Code))
            return BadRequest(new { message = "Request body must include a non-empty code." });

        try
        {
            var tokens = await _zohoService.ExchangeAuthorizationCodeAsync(request.Code.Trim(), cancellationToken);
            return Ok(tokens);
        }
        catch (ZohoOAuthException ex)
        {
            return StatusCode((int)ex.StatusCode, new
            {
                error = ex.ZohoError ?? "token_exchange_failed",
                error_description = ex.Message,
                detail = ex.ZohoErrorDescription,
                raw = ex.RawBody
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // [Authorize(Roles = "Admin,Finance")]
    [HttpGet("sign/templates")]
    public async Task<IActionResult> GetSignTemplates(CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await _zohoService.GetSignTemplatesAsync(cancellationToken));
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // [Authorize(Roles = "Admin,Finance")]
    [HttpGet("sign/templates/{templateId}")]
    public async Task<IActionResult> GetSignTemplate(string templateId, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(templateId))
            return BadRequest(new { message = "templateId is required." });

        try
        {
            return Ok(await _zohoService.GetSignTemplateByIdAsync(templateId, cancellationToken));
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // [Authorize(Roles = "Admin,Finance")]
    [HttpGet("sign/requests")]
    public async Task<IActionResult> GetSignRequests(
        [FromQuery] ZohoSignRequestsListQueryDto? query,
        CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await _zohoService.GetSignRequestsAsync(query ?? new ZohoSignRequestsListQueryDto(), cancellationToken));
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // [Authorize(Roles = "Admin,Finance")]
    [HttpGet("sign/requests/{requestId}")]
    public async Task<IActionResult> GetSignRequest(string requestId, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(requestId))
            return BadRequest(new { message = "requestId is required." });

        try
        {
            return Ok(await _zohoService.GetSignRequestByIdAsync(requestId.Trim(), cancellationToken));
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // [Authorize(Roles = "Admin,Finance")]
    [HttpGet("sign/requests/{requestId}/pdf")]
    public async Task<IActionResult> DownloadSignRequestPdf(
        string requestId,
        [FromQuery] bool withCoc = false,
        [FromQuery] bool merge = true,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(requestId))
            return BadRequest(new { message = "requestId is required." });

        try
        {
            var bytes = await _zohoService.DownloadSignRequestPdfAsync(requestId.Trim(), withCoc, merge, cancellationToken);
            return File(bytes, "application/pdf", $"zoho-sign-{requestId.Trim()}.pdf");
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // [Authorize(Roles = "Admin,Finance")]
    [HttpPost("sign/send")]
    public async Task<IActionResult> SendForSignature(
        [FromBody] ZohoSignSendRequestDto request,
        CancellationToken cancellationToken)
    {
        if (request == null)
            return BadRequest(new { message = "Request body is required." });
        if (request.SourceId == Guid.Empty)
            return BadRequest(new { message = "sourceId is required." });
        if (request.Type != ZohoSignDocumentType.Invoice && string.IsNullOrWhiteSpace(request.TemplateId))
            return BadRequest(new { message = "templateId is required for non-invoice documents." });
        if (!Enum.IsDefined(typeof(ZohoSignDocumentType), request.Type))
            return BadRequest(new { message = "Invalid document type." });

        try
        {
            var result = await _zohoService.SendDocumentForSignatureAsync(
                request.Type,
                request.SourceId,
                request.TemplateId?.Trim() ?? "",
                request.Notes,
                cancellationToken);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [AllowAnonymous]
    [HttpPost("sign/webhook")]
    public async Task<IActionResult> SignWebhook(CancellationToken cancellationToken)
    {
        try
        {
            using var reader = new StreamReader(Request.Body);
            var body = await reader.ReadToEndAsync(cancellationToken);
            if (string.IsNullOrWhiteSpace(body))
                return Ok();

            var node = System.Text.Json.Nodes.JsonNode.Parse(body);
            if (node != null)
                await _zohoService.HandleSignWebhookAsync(node, cancellationToken);

            return Ok();
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }
}
