namespace QubiqonFinanceHub.API.Services;

/// <summary>
/// Platform rule: effective org = active override when set, otherwise home org.
/// </summary>
public static class OrganizationContextResolver
{
    public static Guid ResolveEffective(Guid homeOrganizationId, Guid? activeOrganizationId) =>
        activeOrganizationId ?? homeOrganizationId;
}
