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

    public Guid GetCurrentOrganizationId()
    {
        var claim = _httpContextAccessor.HttpContext?.User?.FindFirst("org_id")?.Value
                    ?? _httpContextAccessor.HttpContext?.User?.FindFirst("tid")?.Value;
        if (Guid.TryParse(claim, out var id)) return id;
        return DevOrgId; // DEV fallback
    }

    public Guid GetCurrentEmployeeId()
    {
        var claim = _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                    ?? _httpContextAccessor.HttpContext?.User?.FindFirst("oid")?.Value;
        if (Guid.TryParse(claim, out var id)) return id;
        return DevEmpId; // DEV fallback
    }

    public async Task<Employee> GetCurrentEmployeeAsync()
    {
        var empId = GetCurrentEmployeeId();
        var emp = await _db.Employees.FirstOrDefaultAsync(e => e.EntraObjectId == empId.ToString());
        return emp ?? new Employee { Id = DevEmpId, FullName = "Dev User", Email = "dev@local.com" };
    }

    public async Task<Organization> GetCurrentOrganizationAsync()
    {
        var orgId = GetCurrentOrganizationId();
        var org = await _db.Organizations.FirstOrDefaultAsync(o => o.Id == orgId);
        return org ?? new Organization { Id = DevOrgId, Name = "Dev Org", Slug = "dev" };
    }
}