using QubiqonFinanceHub.API.Data;
using QubiqonFinanceHub.API.Models.Entities;
using QubiqonFinanceHub.API.Services;
using QubiqonFinanceHub.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace QubiqonFinanceHub.API.Services.Implementations;

public class TenantService : ITenantService
{
    private const string EffectiveOrgIdItemKey = "EffectiveOrganizationId";

    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly FinanceHubDbContext _db;

    private static readonly Guid DevOrgId = Guid.Parse("00000000-0000-0000-0000-000000000001");
    private static readonly Guid DevEmpId = Guid.Parse("00000000-0000-0000-0000-000000000000");

    public TenantService(IHttpContextAccessor httpContextAccessor, FinanceHubDbContext db)
    {
        _httpContextAccessor = httpContextAccessor;
        _db = db;
    }

    public async Task<Guid> GetHomeOrganizationIdAsync()
    {
        var emp = await GetCurrentEmployeeAsync();
        return emp.OrganizationId;
    }

    public async Task<Guid?> GetActiveOrganizationIdAsync()
    {
        var emp = await GetCurrentEmployeeAsync();
        return emp.OrganizationContext?.ActiveOrganizationId;
    }

    public async Task<Guid> GetEffectiveOrganizationIdAsync()
    {
        var httpContext = _httpContextAccessor.HttpContext;
        if (httpContext?.Items.TryGetValue(EffectiveOrgIdItemKey, out var cached) == true && cached is Guid cachedId)
            return cachedId;

        var emp = await GetCurrentEmployeeAsync();
        if (emp.Id == DevEmpId)
        {
            var devOrg = await _db.Organizations
                .Where(o => o.IsActive)
                .OrderBy(o => o.OrgName)
                .Select(o => o.Id)
                .FirstOrDefaultAsync();
            return devOrg != Guid.Empty ? devOrg : DevOrgId;
        }

        var home = emp.OrganizationId;
        var active = emp.OrganizationContext?.ActiveOrganizationId;
        var effective = OrganizationContextResolver.ResolveEffective(home, active);

        var org = await _db.Organizations.FirstOrDefaultAsync(o => o.Id == effective);
        if (org == null || !org.IsActive)
            throw new InvalidOperationException("Organization not found or inactive.");

        if (httpContext != null)
            httpContext.Items[EffectiveOrgIdItemKey] = effective;

        return effective;
    }

    public Task<Guid> GetCurrentOrganizationId() => GetEffectiveOrganizationIdAsync();

    public Guid GetCurrentEmployeeId()
    {
        var claim = _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                    ?? _httpContextAccessor.HttpContext?.User?.FindFirst("oid")?.Value;
        if (Guid.TryParse(claim, out var id)) return id;
        return DevEmpId;
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

        var emp = await _db.Employees
            .Include(e => e.OrganizationContext)
            .Include(e => e.FinanceRole!)
                .ThenInclude(fr => fr.Role)
            .FirstOrDefaultAsync(e => e.EntraObjectId == empId.ToString());

        if (emp == null)
        {
            emp = await _db.Employees
                .Include(e => e.OrganizationContext)
                .Include(e => e.FinanceRole!)
                    .ThenInclude(fr => fr.Role)
                .FirstOrDefaultAsync(e => e.Email == email);
            if (emp != null)
            {
                emp.EntraObjectId = empId.ToString();
                await _db.SaveChangesAsync();
            }
        }

        if (emp != null && emp.IsActive == false)
            throw new Exception("You have been deactivated from the application");

        return emp ?? new Employee { Id = DevEmpId, FullName = "Dev User", Email = "dev@local.com", OrganizationId = DevOrgId };
    }

    public async Task<Organization> GetCurrentOrganizationAsync()
    {
        var orgId = await GetEffectiveOrganizationIdAsync();
        var org = await _db.Organizations.FirstOrDefaultAsync(o => o.Id == orgId);
        return org ?? new Organization { Id = DevOrgId, OrgName = "Dev Org", SubName = "dev" };
    }
}
