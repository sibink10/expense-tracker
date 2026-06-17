namespace QubiqonFinanceHub.API.Auth.Shared;

public enum TrustedTokenValidationFailure
{
  None,
  NotJwt,
  Invalid
}

public sealed record TrustedTokenValidationResult(
    TrustedTokenPrincipal? Principal,
    TrustedTokenValidationFailure Failure = TrustedTokenValidationFailure.None)
{
    public static TrustedTokenValidationResult Success(TrustedTokenPrincipal principal) =>
        new(principal, TrustedTokenValidationFailure.None);

    public static TrustedTokenValidationResult NotJwt() =>
        new(null, TrustedTokenValidationFailure.NotJwt);

    public static TrustedTokenValidationResult Invalid() =>
        new(null, TrustedTokenValidationFailure.Invalid);
}
