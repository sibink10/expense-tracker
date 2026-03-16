using Microsoft.EntityFrameworkCore;
using QubiqonFinanceHub.API.Data;
using QubiqonFinanceHub.API.DTOs;
using QubiqonFinanceHub.API.Models.Entities;
using QubiqonFinanceHub.API.Services.Interfaces;

namespace QubiqonFinanceHub.API.Services.Implementations;

public class CategoryService : ICategoryService
{
    private readonly FinanceHubDbContext _db;
    private readonly ITenantService _tenant;

    public CategoryService(FinanceHubDbContext db, ITenantService tenant)
    {
        _db = db;
        _tenant = tenant;
    }

    public async Task<List<CategoryDto>> GetAllAsync()
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        return await _db.Categories
            .Where(x => x.OrganizationId == orgId)
            .OrderBy(x => x.Name)
            .Select(x => ToDto(x))
            .ToListAsync();
    }

    public async Task<CategoryDto?> GetByIdAsync(Guid id)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var category = await _db.Categories
            .FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId);
        return category == null ? null : ToDto(category);
    }

    public async Task<CategoryDto> CreateAsync(CreateCategoryRequest dto)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();

        var exists = await _db.Categories
            .AnyAsync(x => x.OrganizationId == orgId && x.Name == dto.Name && x.IsActive);
        if (exists)
            throw new InvalidOperationException($"Category '{dto.Name}' already exists.");

        var category = new Category
        {
            Id = Guid.NewGuid(),
            OrganizationId = orgId,
            Name = dto.Name.Trim(),
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.Categories.Add(category);
        await _db.SaveChangesAsync();
        return ToDto(category);
    }

    public async Task<CategoryDto> UpdateAsync(Guid id, UpdateCategoryRequest dto)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var category = await _db.Categories
            .FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId)
            ?? throw new KeyNotFoundException("Category not found.");

        var exists = await _db.Categories
            .AnyAsync(x => x.OrganizationId == orgId
                        && x.Name == dto.Name
                        && x.Id != id
                        && x.IsActive);
        if (exists)
            throw new InvalidOperationException($"Category '{dto.Name}' already exists.");

        category.Name = dto.Name.Trim();
        category.IsActive = dto.IsActive;
        category.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return ToDto(category);
    }

    public async Task DeleteAsync(Guid id)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var category = await _db.Categories
            .FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId)
            ?? throw new KeyNotFoundException("Category not found.");

        category.IsActive = false;
        category.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    public async Task<CategoryDto> ToggleActiveAsync(Guid id)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var category = await _db.Categories
            .FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId)
            ?? throw new KeyNotFoundException("Category not found.");

        category.IsActive = !category.IsActive;
        category.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return ToDto(category);
    }

    private static CategoryDto ToDto(Category c) => new(c.Id, c.Name, c.IsActive);
}