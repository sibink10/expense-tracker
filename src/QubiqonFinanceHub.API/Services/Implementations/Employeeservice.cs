using Microsoft.EntityFrameworkCore;
using QubiqonFinanceHub.API.Data;
using QubiqonFinanceHub.API.DTOs;
using QubiqonFinanceHub.API.Models.Entities;
using QubiqonFinanceHub.API.Models.Enums;
using QubiqonFinanceHub.API.Services.Interfaces;

namespace QubiqonFinanceHub.API.Services.Implementations;

public class EmployeeService : IEmployeeService
{
    private readonly FinanceHubDbContext _db;
    private readonly ITenantService _tenant;

    public EmployeeService(FinanceHubDbContext db, ITenantService tenant)
    { _db = db; _tenant = tenant; }

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
        q = f.Desc ? q.OrderByDescending(e => e.FullName) : q.OrderBy(e => e.FullName);
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
        var emp = new Employee
        {
            Id = Guid.NewGuid(),
            OrganizationId = orgId,
            EntraObjectId = dto.EntraObjectId ?? "",
            FullName = dto.FullName,
            Email = dto.Email,
            Department = dto.Department,
            Designation = dto.Designation,
            EmployeeCode = dto.EmployeeCode,
            Role = Enum.Parse<UserRole>(dto.Role, true),
            IsActive = true,
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

        if (dto.FullName != null) emp.FullName = dto.FullName;
        if (dto.Department != null) emp.Department = dto.Department;
        if (dto.Designation != null) emp.Designation = dto.Designation;
        if (dto.EmployeeCode != null) emp.EmployeeCode = dto.EmployeeCode;
        if (dto.Role != null) emp.Role = Enum.Parse<UserRole>(dto.Role, true);
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