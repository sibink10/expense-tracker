using Microsoft.EntityFrameworkCore;
using QubiqonFinanceHub.API.Data;
using QubiqonFinanceHub.API.Models.Entities;
using QubiqonFinanceHub.API.Models.Enums;

namespace QubiqonFinanceHub.API.Auth.Finance;

public static class FinanceEmployeeRoleHelper
{
    public static UserRole ResolveUserRole(Employee emp) =>
        UserRoleConverter.FromDb(emp.FinanceRole?.Role?.Code);

    public static string ResolveRoleCode(Employee emp) =>
        emp.FinanceRole?.Role?.Code ?? UserRole.Employee.ToString();

    public static IQueryable<Employee> WhereHasRole(IQueryable<Employee> q, UserRole role) =>
        WhereHasRoleCode(q, role.ToString());

    public static IQueryable<Employee> WhereHasRoleCode(IQueryable<Employee> q, string roleCode)
    {
        var normalized = roleCode.Trim();
        return q.Where(e =>
            e.FinanceRole != null
            && e.FinanceRole.IsActive
            && e.FinanceRole.Role != null
            && e.FinanceRole.Role.Code == normalized);
    }

    public static async Task UpsertFinanceRoleAsync(
        FinanceHubDbContext db, Guid employeeId, int roleId, CancellationToken ct = default)
    {
        var existing = await db.FinanceEmployeeRoles
            .FirstOrDefaultAsync(r => r.EmployeeId == employeeId, ct);

        if (existing == null)
        {
            db.FinanceEmployeeRoles.Add(new FinanceEmployeeRole
            {
                Id = Guid.NewGuid(),
                EmployeeId = employeeId,
                RoleId = roleId,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            });
            return;
        }

        existing.RoleId = roleId;
        existing.IsActive = true;
        existing.UpdatedAt = DateTime.UtcNow;
    }
}
