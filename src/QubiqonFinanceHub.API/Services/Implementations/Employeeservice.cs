using Microsoft.EntityFrameworkCore;
using QubiqonFinanceHub.API.Data;
using QubiqonFinanceHub.API.DTOs;
using QubiqonFinanceHub.API.Models.Entities;
using QubiqonFinanceHub.API.Models.Enums;
using QubiqonFinanceHub.API.Services.Helpers;
using QubiqonFinanceHub.API.Services.Interfaces;

namespace QubiqonFinanceHub.API.Services.Implementations;

public class EmployeeService : IEmployeeService
{
    private readonly FinanceHubDbContext _db;
    private readonly ITenantService _tenant;
    private readonly IAzureRoleService _azureRoleService;

    public EmployeeService(FinanceHubDbContext db, ITenantService tenant, IAzureRoleService azureRoleService)
    { _db = db; _tenant = tenant; _azureRoleService = azureRoleService; }

    public async Task<PaginatedResult<EmployeeDto>> ListAsync(FilterParams f)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var q = _db.Employees
            .Where(e => e.OrganizationId == orgId && !e.IsDelete)
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(f.Search))
        {
            var s = f.Search.ToLower();
            q = q.Where(e => e.FullName.ToLower().Contains(s) || e.Email.ToLower().Contains(s));
        }

        var total = await q.CountAsync();
        q = q.ApplyEmployeeSorting(f);
        var items = await q.Skip((f.Page - 1) * f.PageSize).Take(f.PageSize).ToListAsync();

        return new PaginatedResult<EmployeeDto>(items.Select(MapToDto).ToList(), total, f.Page, f.PageSize);
    }

    public async Task<EmployeeDto?> GetByIdAsync(Guid id)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var emp = await _db.Employees.AsNoTracking()
            .FirstOrDefaultAsync(e => e.Id == id && e.OrganizationId == orgId);
        return emp == null ? null : MapToDto(emp);
    }

    public async Task<EmployeeDto> CreateAsync(CreateEmployeeRequest dto)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var entraId = string.IsNullOrWhiteSpace(dto.EntraObjectId) ? null : dto.EntraObjectId.Trim();
        var email = dto.Email?.Trim() ?? "";

        if (string.IsNullOrWhiteSpace(email))
            throw new ArgumentException("Email is required", nameof(dto));

        // Uniqueness should ignore soft-deleted employees (IsDelete == true).
        // If a soft-deleted employee exists for a unique field, re-activate it instead of inserting a new row.
        var activeByEmail = await _db.Employees
            .FirstOrDefaultAsync(e => e.OrganizationId == orgId && !e.IsDelete && e.Email == email);
        if (activeByEmail != null)
            throw new InvalidOperationException("Employee with this email already exists");

        var deletedByEmail = await _db.Employees
            .FirstOrDefaultAsync(e => e.OrganizationId == orgId && e.IsDelete && e.Email == email);
        if (deletedByEmail != null)
        {
            // Avoid violating unique constraints when we update EntraObjectId on this re-activated employee.
            if (!string.IsNullOrWhiteSpace(entraId))
            {
                var otherWithSameEntra = await _db.Employees
                    .FirstOrDefaultAsync(e => e.OrganizationId == orgId && e.Id != deletedByEmail.Id && e.EntraObjectId == entraId);
                if (otherWithSameEntra != null)
                    throw new InvalidOperationException("Employee with this EntraObjectId already exists");
            }

            deletedByEmail.EntraObjectId = entraId;
            deletedByEmail.FullName = dto.FullName;
            deletedByEmail.Department = dto.Department;
            deletedByEmail.Designation = dto.Designation;
            deletedByEmail.EmployeeCode = dto.EmployeeCode;
            deletedByEmail.Role = Enum.Parse<UserRole>(dto.Role, true);
            deletedByEmail.Email = email;
            deletedByEmail.IsActive = true;
            deletedByEmail.IsDelete = false;
            deletedByEmail.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            return MapToDto(deletedByEmail);
        }

        if (!string.IsNullOrWhiteSpace(entraId))
        {
            var activeByEntra = await _db.Employees
                .FirstOrDefaultAsync(e => e.OrganizationId == orgId && !e.IsDelete && e.EntraObjectId == entraId);
            if (activeByEntra != null)
                throw new InvalidOperationException("Employee with this EntraObjectId already exists");

            var deletedByEntra = await _db.Employees
                .FirstOrDefaultAsync(e => e.OrganizationId == orgId && e.IsDelete && e.EntraObjectId == entraId);
            if (deletedByEntra != null)
            {
                // Email uniqueness was checked above (activeByEmail + deletedByEmail).
                deletedByEntra.EntraObjectId = entraId;
                deletedByEntra.FullName = dto.FullName;
                deletedByEntra.Department = dto.Department;
                deletedByEntra.Designation = dto.Designation;
                deletedByEntra.EmployeeCode = dto.EmployeeCode;
                deletedByEntra.Role = Enum.Parse<UserRole>(dto.Role, true);
                deletedByEntra.Email = email;
                deletedByEntra.IsActive = true;
                deletedByEntra.IsDelete = false;
                deletedByEntra.UpdatedAt = DateTime.UtcNow;

                if (!string.IsNullOrWhiteSpace(deletedByEntra.EntraObjectId))
                    await _azureRoleService.AssignRoleAsync(deletedByEntra.EntraObjectId, deletedByEntra.Role);
                await _db.SaveChangesAsync();
                return MapToDto(deletedByEntra);
            }
        }

        var emp = new Employee
        {
            Id = Guid.NewGuid(),
            OrganizationId = orgId,
            EntraObjectId = entraId,
            FullName = dto.FullName,
            Email = email,
            Department = dto.Department,
            Designation = dto.Designation,
            EmployeeCode = dto.EmployeeCode,
            Role = Enum.Parse<UserRole>(dto.Role, true),
            IsActive = true,
            IsDelete = false,
            CreatedAt = DateTime.UtcNow
        };
        _db.Employees.Add(emp);
        await _db.SaveChangesAsync();
        return MapToDto(emp);
    }

    public async Task<EmployeeDto> UpdateAsync(Guid id, UpdateEmployeeRequest dto)
        {
            var orgId = await _tenant.GetCurrentOrganizationId();
            var emp = await _db.Employees
                .FirstOrDefaultAsync(e => e.Id == id && e.OrganizationId == orgId)
                ?? throw new KeyNotFoundException("Employee not found");

            if (dto.FullName != null)     emp.FullName     = dto.FullName;
            if (dto.Department != null)   emp.Department   = dto.Department;
            if (dto.Designation != null)  emp.Designation  = dto.Designation;
            if (dto.EmployeeCode != null) emp.EmployeeCode = dto.EmployeeCode;

            if (dto.Role != null)
            {
                var newRole = Enum.Parse<UserRole>(dto.Role, true);
                emp.Role = newRole;

                // Sync role to Azure AD
                await _azureRoleService.AssignRoleAsync(emp.EntraObjectId ?? "", newRole);
            }

            emp.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return MapToDto(emp);
        }

    public async Task<EmployeeDto> ToggleActiveAsync(Guid id)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var emp = await _db.Employees
            .FirstOrDefaultAsync(e => e.Id == id && e.OrganizationId == orgId)
            ?? throw new KeyNotFoundException("Employee not found");

        emp.IsActive = !emp.IsActive;
        emp.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return MapToDto(emp);
    }


    public async Task<EmployeeDto> DeleteAsync(Guid id)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var emp = await _db.Employees
            .FirstOrDefaultAsync(e => e.Id == id && e.OrganizationId == orgId)
            ?? throw new KeyNotFoundException("Employee not found");

        if (emp.IsDelete)
            throw new InvalidOperationException("Employee is already deleted");

        emp.IsDelete = true;
        emp.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return MapToDto(emp);
    }

    private static EmployeeDto MapToDto(Employee e) => new(
        e.Id, e.FullName, e.Email, e.Department,
        e.Designation, e.EmployeeCode, e.Role.ToString(), e.IsActive
    );
}