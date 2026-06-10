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
    IAuthSessionStore sessionStore) : ControllerBase
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
        var session = await globalAuth.CompleteOAuthCallbackAsync(code, callbackUrl, ct);

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
}
