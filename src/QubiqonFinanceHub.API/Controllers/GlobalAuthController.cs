using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QubiqonFinanceHub.API.Auth.Finance;
using QubiqonFinanceHub.API.Auth.Shared;

namespace QubiqonFinanceHub.API.Controllers;

[ApiController]
[Route("api/auth")]
public class GlobalAuthController(
    IGlobalAuthService globalAuth,
    IAppJwtService appJwt,
    IFinanceRoleResolver roleResolver,
    IAuthSessionStore sessionStore,
    ITrustedAzureAccessTokenValidator trustedTokenValidator,
    IEmployeeProvisioningService employeeProvisioning) : ControllerBase
{
    [HttpGet("login")]
    [AllowAnonymous]
    public IActionResult Login([FromQuery] string returnUrl)
    {
        if (!globalAuth.TryValidateReturnUrl(returnUrl, out _))
            return BadRequest("Invalid return URL.");

        var callbackUrl = globalAuth.GetOAuthRedirectUri();
        var loginUrl = globalAuth.BuildLoginUrl(returnUrl, callbackUrl);
        return Redirect(loginUrl);
    }

    [HttpGet("callback")]
    [AllowAnonymous]
    public async Task<IActionResult> Callback(
        [FromQuery] string? code,
        [FromQuery] string? state,
        [FromQuery] string? error,
        CancellationToken ct)
    {
        if (!string.IsNullOrEmpty(error))
            return BadRequest($"Microsoft login failed: {error}");

        if (string.IsNullOrEmpty(code) || string.IsNullOrEmpty(state))
            return BadRequest("Missing authorization code or state.");

        if (!globalAuth.TryValidateState(state, out var returnUrl) || returnUrl == null)
            return BadRequest("Invalid or expired state.");

        var callbackUrl = globalAuth.GetOAuthRedirectUri();

        AuthSession session;
        try
        {
            session = await globalAuth.CompleteOAuthCallbackAsync(code, callbackUrl, ct);
        }
        catch (FinanceAccessDeniedException)
        {
            var separator = returnUrl.Contains('?') ? "&" : "?";
            return Redirect($"{returnUrl}{separator}authError=access_denied");
        }

        var isLocalhost = globalAuth.IsLocalhostRedirectUri();
        globalAuth.SetSessionCookie(Response, session.SessionId, isLocalhost);

        return Redirect(returnUrl);
    }

    [HttpGet("token")]
    [AllowAnonymous]
    public async Task<IActionResult> Token(CancellationToken ct)
    {
        if (HttpContext.Items[SessionContextKeys.AuthSession] is not AuthSession session)
            return Unauthorized();

        var role = await roleResolver.ResolveAsync(session.UserOid, ct);
        if (role == null)
            return Forbid();

        var (token, expiresIn) = appJwt.CreateToken(session.UserOid, session.Email, role.Value.RoleName);
        return Ok(new { accessToken = token, expiresIn });
    }

    [HttpPost("exchange")]
    [AllowAnonymous]
    public async Task<IActionResult> Exchange(CancellationToken ct)
    {
        if (!TryGetBearerToken(Request.Headers.Authorization, out var azureToken))
            return Unauthorized();

        var validation = await trustedTokenValidator.ValidateAsync(azureToken, ct);
        if (validation.Failure == TrustedTokenValidationFailure.NotJwt)
        {
            return Unauthorized(new
            {
                error = "opaque_access_token",
                message =
                    "The bearer token is not a JWT. App B must request a v2 access token for its own API " +
                    "(scope api://{AppB-ClientId}/access_as_user) and set accessTokenAcceptedVersion: 2 " +
                    "on the App B API app registration manifest. Send result.accessToken, not idToken."
            });
        }

        if (validation.Principal == null)
        {
            return Unauthorized(new
            {
                error = "invalid_trusted_token",
                message =
                    "Token signature, audience, or required claims are invalid, or the tenant/app is not trusted."
            });
        }

        var principal = validation.Principal;

        var employee = await employeeProvisioning.FindByEntraObjectIdAsync(principal.Oid, ct);
        if (employee == null)
        {
            return StatusCode(403, new
            {
                error = "user_not_found",
                message = "User is not registered in Finance. Contact your administrator."
            });
        }

        var role = await roleResolver.ResolveAsync(principal.Oid, ct);
        if (role == null)
        {
            return StatusCode(403, new
            {
                error = "access_denied",
                message = "User account is deactivated or not authorized for Finance."
            });
        }

        var (token, expiresIn) = appJwt.CreateToken(
            principal.Oid, principal.Email, role.Value.RoleName);
        return Ok(new { accessToken = token, expiresIn });
    }

    [HttpPost("logout")]
    [AllowAnonymous]
    public async Task<IActionResult> Logout(CancellationToken ct)
    {
        if (HttpContext.Items[SessionContextKeys.AuthSession] is AuthSession session)
            await sessionStore.RevokeAsync(session.SessionId, ct);

        var isLocalhost = globalAuth.IsLocalhostRedirectUri();
        globalAuth.ClearSessionCookie(Response, isLocalhost);
        return Ok();
    }

    private static bool TryGetBearerToken(string? authorizationHeader, out string token)
    {
        token = "";
        if (string.IsNullOrWhiteSpace(authorizationHeader))
            return false;

        const string prefix = "Bearer ";
        if (!authorizationHeader.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
            return false;

        token = authorizationHeader[prefix.Length..].Trim();
        return !string.IsNullOrWhiteSpace(token);
    }
}
