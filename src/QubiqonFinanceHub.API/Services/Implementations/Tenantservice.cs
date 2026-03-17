using QubiqonFinanceHub.API.Data;
using QubiqonFinanceHub.API.Models.Entities;
using QubiqonFinanceHub.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace QubiqonFinanceHub.API.Services.Implementations;

public class TenantService : ITenantService
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly FinanceHubDbContext _db;

    private static readonly Guid DevOrgId = Guid.Parse("00000000-0000-0000-0000-000000000001");
    private static readonly Guid DevEmpId = Guid.Parse("00000000-0000-0000-0000-000000000000");

    public TenantService(IHttpContextAccessor httpContextAccessor, FinanceHubDbContext db)
    {
        _httpContextAccessor = httpContextAccessor;
        _db = db;
    }

    public async Task<Guid> GetCurrentOrganizationId()
    {
        var selected = await _db.Organizations
            .Where(o => o.Selected)
            .Select(o => o.Id)
            .FirstOrDefaultAsync();

        if (selected != Guid.Empty)
            return selected;

        var first = await _db.Organizations
            .Select(o => o.Id)
            .FirstOrDefaultAsync();

        return first != Guid.Empty ? first : DevOrgId;
    }

    public Guid GetCurrentEmployeeId()
    {
        var claim = _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                    ?? _httpContextAccessor.HttpContext?.User?.FindFirst("oid")?.Value;
        if (Guid.TryParse(claim, out var id)) return id;
        return DevEmpId; // DEV fallback
    }

    public string? GetCurrentUserEmail()
    {
        return _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.Email)?.Value
               ?? _httpContextAccessor.HttpContext?.User?.FindFirst("email")?.Value
               ?? _httpContextAccessor.HttpContext?.User?.FindFirst("preferred_username")?.Value;
    }

    public async Task<Employee> GetCurrentEmployeeAsync()
    {
        var empId = GetCurrentEmployeeId();
        var email = GetCurrentUserEmail();

        var emp = await _db.Employees.FirstOrDefaultAsync(e => e.EntraObjectId == empId.ToString());

        if (emp == null)
        {
            emp = await _db.Employees.FirstOrDefaultAsync(e => e.Email == email);
            if (emp != null)
            {
                emp.EntraObjectId = empId.ToString();
                await _db.SaveChangesAsync();
            }
        }
        if (emp != null && emp.IsActive == false)
            throw new Exception("You have been deactivated from the application");
        return emp ?? new Employee { Id = DevEmpId, FullName = "Dev User", Email = "dev@local.com" };
    }

    public async Task<Organization> GetCurrentOrganizationAsync()
    {
        var orgId = await GetCurrentOrganizationId();
        var org = await _db.Organizations.FirstOrDefaultAsync(o => o.Id == orgId);
        return org ?? new Organization { Id = DevOrgId, OrgName = "Dev Org", SubName = "dev" };
    }
}