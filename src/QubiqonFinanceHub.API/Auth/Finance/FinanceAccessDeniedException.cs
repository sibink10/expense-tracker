namespace QubiqonFinanceHub.API.Auth.Finance;

public sealed class FinanceAccessDeniedException : Exception
{
    public FinanceAccessDeniedException()
        : base("User is not authorized for Finance.") { }
}
