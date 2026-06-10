namespace QubiqonFinanceHub.API.Auth.Shared;

public sealed class SessionUser
{
    public Guid SessionId { get; init; }
    public string UserOid { get; init; } = "";
    public string Email { get; init; } = "";
}

public static class SessionContextKeys
{
    public const string SessionUser = "QubiqonSessionUser";
    public const string AuthSession = "QubiqonAuthSession";
}
