using Microsoft.EntityFrameworkCore;
using QubiqonFinanceHub.API.Data;

namespace QubiqonFinanceHub.API.Auth.Shared;

public class AuthSessionStore(FinanceHubDbContext db) : IAuthSessionStore
{
    public async Task<AuthSession?> GetValidSessionAsync(Guid sessionId, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        return await db.AuthSessions
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.SessionId == sessionId && s.ExpiresAt > now, ct);
    }

    public async Task<AuthSession> CreateAsync(AuthSession session, CancellationToken ct = default)
    {
        db.AuthSessions.Add(session);
        await db.SaveChangesAsync(ct);
        return session;
    }

    public async Task UpdateAsync(AuthSession session, CancellationToken ct = default)
    {
        db.AuthSessions.Update(session);
        await db.SaveChangesAsync(ct);
    }

    public async Task RevokeAsync(Guid sessionId, CancellationToken ct = default)
    {
        var session = await db.AuthSessions.FirstOrDefaultAsync(s => s.SessionId == sessionId, ct);
        if (session == null) return;
        db.AuthSessions.Remove(session);
        await db.SaveChangesAsync(ct);
    }
}
