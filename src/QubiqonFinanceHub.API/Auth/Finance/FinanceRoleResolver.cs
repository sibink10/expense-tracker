using Microsoft.EntityFrameworkCore;
using QubiqonFinanceHub.API.Data;
using QubiqonFinanceHub.API.Models.Enums;

namespace QubiqonFinanceHub.API.Auth.Finance;

public interface IFinanceRoleResolver
{
    Task<(UserRole Role, string RoleName)?> ResolveAsync(string userOid, CancellationToken ct = default);
}

public class FinanceRoleResolver(FinanceHubDbContext db) : IFinanceRoleResolver
{
    public async Task<(UserRole Role, string RoleName)?> ResolveAsync(string userOid, CancellationToken ct = default)
    {
        var emp = await db.Employees
            .Include(e => e.FinanceRole!)
                .ThenInclude(fr => fr.Role)
            .FirstOrDefaultAsync(e => e.EntraObjectId == userOid, ct);

        if (emp == null || !emp.IsActive || emp.IsDelete)
            return null;

        if (emp.FinanceRole?.Role != null
            && Enum.TryParse<UserRole>(emp.FinanceRole.Role.Code, true, out var financeRole))
            return (financeRole, financeRole.ToString());

        return (emp.Role, emp.Role.ToString());
    }
}
