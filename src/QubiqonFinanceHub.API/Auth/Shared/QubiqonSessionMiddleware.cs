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
                    session = await tokenRefresh.EnsureFreshAzureTokensAsync(session, context.RequestAborted);
                }
                catch (UnauthorizedAccessException)
                {
                    session = null;
                }

                if (session != null)
                {
                    context.Items[SessionContextKeys.AuthSession] = session;
                    context.Items[SessionContextKeys.SessionUser] = new SessionUser
                    {
                        SessionId = session.SessionId,
                        UserOid = session.UserOid,
                        Email = session.Email
                    };
                }
            }
        }

        await next(context);
    }
}
