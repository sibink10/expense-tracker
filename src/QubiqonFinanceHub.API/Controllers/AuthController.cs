using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QubiqonFinanceHub.API.Data;
using QubiqonFinanceHub.API.DTOs;
using QubiqonFinanceHub.API.Models.Entities;
using QubiqonFinanceHub.API.Models.Enums;
using QubiqonFinanceHub.API.Services;

namespace QubiqonFinanceHub.API.Controllers;

[ApiController, Route("api/auth"), Authorize]
public class AuthController(FinanceHubDbContext db) : ControllerBase
{
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var oid = User.FindFirst("oid")?.Value ?? User.FindFirst("sub")?.Value;
        var email = User.FindFirst("preferred_username")?.Value ?? User.FindFirst("email")?.Value;
        var name = User.FindFirst("name")?.Value ?? email ?? "Unknown";

        var emp = await db.Employees
            .Include(e => e.OrganizationContext)
            .FirstOrDefaultAsync(e => e.EntraObjectId == oid);

        if (emp == null)
        {
            var seedOrg = await db.Organizations
                .Where(o => o.IsActive)
                .OrderBy(o => o.OrgName)
                .FirstOrDefaultAsync();

            if (seedOrg == null) return NotFound("Organization not found");

            emp = new Employee
            {
                Id = Guid.Parse(oid!),
                OrganizationId = seedOrg.Id,
                EntraObjectId = oid!,
                FullName = name,
                Email = email ?? "",
                Role = UserRole.Employee,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                IsDelete = false
            };
            db.Employees.Add(emp);
            await db.SaveChangesAsync();
        }

        if (emp.IsActive == false || emp.IsDelete == true)
            throw new Exception("You have been deactivated from the application or deleted from the application");

        var homeOrgId = emp.OrganizationId;
        var activeOrgId = emp.OrganizationContext?.ActiveOrganizationId;
        var effectiveOrgId = OrganizationContextResolver.ResolveEffective(homeOrgId, activeOrgId);

        var effectiveOrg = await db.Organizations.FirstOrDefaultAsync(o => o.Id == effectiveOrgId && o.IsActive);
        if (effectiveOrg == null) return NotFound("Organization not found");

        var parts = emp.FullName.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        var initials = parts.Length >= 2
            ? $"{parts[0][0]}{parts[^1][0]}"
            : emp.FullName[..Math.Min(2, emp.FullName.Length)];

        return Ok(new CurrentUserDto(
            emp.Id,
            emp.FullName,
            emp.Email,
            emp.Department,
            emp.Designation,
            emp.Role,
            initials.ToUpper(),
            effectiveOrgId,
            effectiveOrg.OrgName,
            homeOrgId,
            activeOrgId,
            effectiveOrgId
        ));
    }

    [HttpGet("debug-claims")]
    [AllowAnonymous]
    public IActionResult DebugClaims()
    {
        var claims = User.Claims.Select(c => new { c.Type, c.Value }).ToList();
        return Ok(new
        {
            isAuthenticated = User,
            claims
        });
    }
}
