using Microsoft.EntityFrameworkCore;
using QubiqonFinanceHub.API.Data;
using QubiqonFinanceHub.API.Models.Entities;
using QubiqonFinanceHub.API.Models.Enums;

namespace QubiqonFinanceHub.API.Auth.Finance;

public interface IEmployeeProvisioningService
{
    Task<Employee?> FindByEntraObjectIdAsync(string oid, CancellationToken ct = default);
    Task EnsureEmployeeAsync(string oid, string email, string name, CancellationToken ct = default);
}

public class EmployeeProvisioningService(FinanceHubDbContext db) : IEmployeeProvisioningService
{
    public Task<Employee?> FindByEntraObjectIdAsync(string oid, CancellationToken ct = default) =>
        db.Employees.FirstOrDefaultAsync(e => e.EntraObjectId == oid, ct);

    public async Task EnsureEmployeeAsync(string oid, string email, string name, CancellationToken ct = default)
    {
        var emp = await db.Employees.FirstOrDefaultAsync(e => e.EntraObjectId == oid, ct);
        if (emp != null) return;

        var seedOrg = await db.Organizations
            .Where(o => o.IsActive)
            .OrderBy(o => o.OrgName)
            .FirstOrDefaultAsync(ct);

        if (seedOrg == null)
            throw new InvalidOperationException("No active organization found for user provisioning.");

        emp = new Employee
        {
            Id = Guid.TryParse(oid, out var parsedId) ? parsedId : Guid.NewGuid(),
            OrganizationId = seedOrg.Id,
            EntraObjectId = oid,
            FullName = name,
            Email = email,
            Role = UserRole.Employee,
            IsActive = true,
            IsDelete = false,
            CreatedAt = DateTime.UtcNow
        };
        db.Employees.Add(emp);
        await db.SaveChangesAsync(ct);
    }
}
