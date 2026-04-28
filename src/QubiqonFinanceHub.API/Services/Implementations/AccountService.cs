using Microsoft.EntityFrameworkCore;
using QubiqonFinanceHub.API.Data;
using QubiqonFinanceHub.API.DTOs;
using QubiqonFinanceHub.API.Models.Entities;
using QubiqonFinanceHub.API.Services.Interfaces;

namespace QubiqonFinanceHub.API.Services.Implementations;

public class AccountService : IAccountService
{
    private readonly FinanceHubDbContext _db;
    private readonly ITenantService _tenant;

    public AccountService(FinanceHubDbContext db, ITenantService tenant)
    {
        _db = db;
        _tenant = tenant;
    }

    public async Task<List<AccountDto>> GetAllAsync()
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        return await _db.Accounts
            .Where(x => x.OrganizationId == orgId)
            .OrderBy(x => x.Name)
            .Select(x => ToDto(x))
            .ToListAsync();
    }

    public async Task<AccountDto?> GetByIdAsync(Guid id)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var entity = await _db.Accounts.FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId);
        return entity == null ? null : ToDto(entity);
    }

    public async Task<AccountDto> CreateAsync(CreateAccountRequest dto)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var name = dto.Name.Trim();
        var shortName = dto.ShortName.Trim().ToLowerInvariant();

        if (string.IsNullOrWhiteSpace(name)) throw new InvalidOperationException("Name is required.");
        if (string.IsNullOrWhiteSpace(shortName)) throw new InvalidOperationException("Short name is required.");

        var exists = await _db.Accounts.AnyAsync(x =>
            x.OrganizationId == orgId &&
            (x.Name == name || x.ShortName == shortName) &&
            x.IsActive);
        if (exists) throw new InvalidOperationException("Account already exists.");

        var entity = new Account
        {
            Id = Guid.NewGuid(),
            OrganizationId = orgId,
            Name = name,
            ShortName = shortName,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.Accounts.Add(entity);
        await _db.SaveChangesAsync();
        return ToDto(entity);
    }

    public async Task<AccountDto> UpdateAsync(Guid id, UpdateAccountRequest dto)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var entity = await _db.Accounts.FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId)
            ?? throw new KeyNotFoundException("Account not found.");

        var name = dto.Name.Trim();
        var shortName = dto.ShortName.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(name)) throw new InvalidOperationException("Name is required.");
        if (string.IsNullOrWhiteSpace(shortName)) throw new InvalidOperationException("Short name is required.");

        var exists = await _db.Accounts.AnyAsync(x =>
            x.OrganizationId == orgId &&
            x.Id != id &&
            (x.Name == name || x.ShortName == shortName) &&
            x.IsActive);
        if (exists) throw new InvalidOperationException("Account already exists.");

        entity.Name = name;
        entity.ShortName = shortName;
        entity.IsActive = dto.IsActive;
        entity.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return ToDto(entity);
    }

    public async Task DeleteAsync(Guid id)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var entity = await _db.Accounts.FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId)
            ?? throw new KeyNotFoundException("Account not found.");

        entity.IsActive = false;
        entity.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    public async Task<AccountDto> ToggleActiveAsync(Guid id)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var entity = await _db.Accounts.FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId)
            ?? throw new KeyNotFoundException("Account not found.");

        entity.IsActive = !entity.IsActive;
        entity.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return ToDto(entity);
    }

    private static AccountDto ToDto(Account x) => new(x.Id, x.Name, x.ShortName, x.IsActive);
}
