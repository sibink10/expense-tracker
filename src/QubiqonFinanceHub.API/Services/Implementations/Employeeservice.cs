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

    public async Task<List<EmployeeDto>> ListAsync()
    {
        var orgId = _tenant.GetCurrentOrganizationId();
        var employees = await _db.Employees
            .Where(e => e.OrganizationId == orgId)
            .OrderBy(e => e.FullName)
            .AsNoTracking()
            .ToListAsync();
        return employees.Select(MapToDto).ToList();
    }

    public async Task<EmployeeDto?> GetByIdAsync(Guid id)
    {
        var orgId = _tenant.GetCurrentOrganizationId();
        var emp = await _db.Employees.AsNoTracking()
            .FirstOrDefaultAsync(e => e.Id == id && e.OrganizationId == orgId);
        return emp == null ? null : MapToDto(emp);
    }

    public async Task<EmployeeDto> CreateAsync(CreateEmployeeRequest dto)
    {
        var orgId = _tenant.GetCurrentOrganizationId();
        var emp = new Employee
        {
            Id = Guid.NewGuid(),
            OrganizationId = orgId,
            EntraObjectId = dto.EntraObjectId,
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
        var orgId = _tenant.GetCurrentOrganizationId();
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
        var orgId = _tenant.GetCurrentOrganizationId();
        var emp = await _db.Employees
            .FirstOrDefaultAsync(e => e.Id == id && e.OrganizationId == orgId)
            ?? throw new KeyNotFoundException("Employee not found");

        emp.IsActive = !emp.IsActive;
        emp.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return MapToDto(emp);
    }

    private static EmployeeDto MapToDto(Employee e) => new(
        e.Id, e.FullName, e.Email, e.Department,
        e.Designation, e.EmployeeCode, e.Role.ToString(), e.IsActive
    );
}