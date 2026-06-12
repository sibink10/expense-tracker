using Microsoft.Extensions.Options;

namespace QubiqonFinanceHub.API.Auth.Shared;

public class QubiqonSessionMiddleware(
    RequestDelegate next,
    IOptions<GlobalAuthOptions> options)
{
    public async Task InvokeAsync(HttpContext context, IAuthSessionStore sessionStore, IAzureTokenRefreshService tokenRefresh)
    {
        var cookieName = options.Value.CookieName;
        if (context.Request.Cookies.TryGetValue(cookieName, out var raw)
            && Guid.TryParse(raw, out var sessionId))
        {
            var session = await sessionStore.GetValidSessionAsync(sessionId, context.RequestAborted);
            if (session != null)
            {
                try
                {
                    var forceRefresh = session.AccessTokenExpiry <= DateTime.UtcNow;
                    session = await tokenRefresh.EnsureFreshAzureTokensAsync(
                        session,
                        context.RequestAborted,
                        forceRefresh: forceRefresh);
                }
                catch (UnauthorizedAccessException)
                {
                    // Keep the session in context so downstream services can attempt refresh
                    // or return a clear session-expired error instead of "no session".
                }

                context.Items[SessionContextKeys.AuthSession] = session;
                context.Items[SessionContextKeys.SessionUser] = new SessionUser
                {
                    SessionId = session.SessionId,
                    UserOid = session.UserOid,
                    Email = session.Email
                };
            }
        }

        await next(context);
    }
}
