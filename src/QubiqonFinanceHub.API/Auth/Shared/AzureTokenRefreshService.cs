namespace QubiqonFinanceHub.API.Auth.Shared;

public interface IAzureTokenRefreshService
{
    Task<AuthSession> EnsureFreshAzureTokensAsync(AuthSession session, CancellationToken ct = default, bool forceRefresh = false);
}

public class AzureTokenRefreshService(
    IAuthSessionStore store,
    IAzureOAuthTokenClient tokenClient,
    ILogger<AzureTokenRefreshService> log) : IAzureTokenRefreshService
{
    public async Task<AuthSession> EnsureFreshAzureTokensAsync(AuthSession session, CancellationToken ct = default, bool forceRefresh = false)
    {
        if (!forceRefresh && session.AccessTokenExpiry > DateTime.UtcNow.AddMinutes(5))
            return session;

        try
        {
            var result = await tokenClient.RefreshAsync(session.RefreshToken, ct);

            session.AzureAccessToken = result.AccessToken;
            if (!string.IsNullOrEmpty(result.RefreshToken))
                session.RefreshToken = result.RefreshToken;
            session.AccessTokenExpiry = result.ExpiresAtUtc;

            await store.UpdateAsync(session, ct);
        }
        catch (Exception ex)
        {
            log.LogWarning(ex, "Failed to refresh Azure token for session {SessionId}", session.SessionId);
            throw new UnauthorizedAccessException("Session expired. Please sign in again.");
        }

        return session;
    }
}
