using Microsoft.EntityFrameworkCore;
using QubiqonFinanceHub.API.Auth.Finance;
using QubiqonFinanceHub.API.Data;
using QubiqonFinanceHub.API.Models.Entities;

namespace QubiqonFinanceHub.API.Auth.Finance;

public interface IEmployeeProvisioningService
{
    Task<Employee?> FindByEntraObjectIdAsync(string oid, CancellationToken ct = default);
    Task EnsureEmployeeAsync(string oid, string email, string name, CancellationToken ct = default);
}

public class EmployeeProvisioningService(FinanceHubDbContext db) : IEmployeeProvisioningService
{
    private const string DefaultRoleCode = "Employee";

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

        var defaultRole = await db.Roles
            .FirstOrDefaultAsync(r => r.IsActive && r.Code == DefaultRoleCode, ct)
            ?? throw new InvalidOperationException($"Role '{DefaultRoleCode}' is not available.");

        emp = new Employee
        {
            Id = Guid.TryParse(oid, out var parsedId) ? parsedId : Guid.NewGuid(),
            OrganizationId = seedOrg.Id,
            EntraObjectId = oid,
            FullName = name,
            Email = email,
            IsActive = true,
            IsDelete = false,
            CreatedAt = DateTime.UtcNow
        };
        db.Employees.Add(emp);
        await FinanceEmployeeRoleHelper.UpsertFinanceRoleAsync(db, emp.Id, defaultRole.Id, ct);
        await db.SaveChangesAsync(ct);
    }
}
