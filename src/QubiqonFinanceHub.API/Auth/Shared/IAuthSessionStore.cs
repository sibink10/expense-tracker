namespace QubiqonFinanceHub.API.Auth.Shared;

public interface IAuthSessionStore
{
    Task<AuthSession?> GetValidSessionAsync(Guid sessionId, CancellationToken ct = default);
    Task<AuthSession> CreateAsync(AuthSession session, CancellationToken ct = default);
    Task UpdateAsync(AuthSession session, CancellationToken ct = default);
    Task RevokeAsync(Guid sessionId, CancellationToken ct = default);
}
