namespace QubiqonFinanceHub.API.Auth.Shared;

public sealed record TrustedTokenPrincipal(
    string Oid,
    string Email,
    string Name,
    string CallingAppClientId);
