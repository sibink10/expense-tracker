using Microsoft.EntityFrameworkCore;
using QubiqonFinanceHub.API.Data;
using QubiqonFinanceHub.API.DTOs;
using QubiqonFinanceHub.API.Models.Entities;
using QubiqonFinanceHub.API.Services.Interfaces;

namespace QubiqonFinanceHub.API.Services.Implementations;

public class PaymentTermService : IPaymentTermService
{
    private readonly FinanceHubDbContext _db;
    private readonly ITenantService _tenant;

    public PaymentTermService(FinanceHubDbContext db, ITenantService tenant)
    {
        _db = db;
        _tenant = tenant;
    }

    public async Task<List<PaymentTermDto>> GetAllAsync()
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        return await _db.PaymentTerms
            .Where(x => x.OrganizationId == orgId)
            .OrderBy(x => x.Days)
            .ThenBy(x => x.Name)
            .Select(x => ToDto(x))
            .ToListAsync();
    }

    public async Task<PaymentTermDto?> GetByIdAsync(Guid id)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var entity = await _db.PaymentTerms.FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId);
        return entity == null ? null : ToDto(entity);
    }

    public async Task<PaymentTermDto> CreateAsync(CreatePaymentTermRequest dto)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var name = dto.Name.Trim();
        var shortName = dto.ShortName.Trim().ToLowerInvariant();

        if (string.IsNullOrWhiteSpace(name)) throw new InvalidOperationException("Name is required.");
        if (string.IsNullOrWhiteSpace(shortName)) throw new InvalidOperationException("Short name is required.");
        if (dto.Days < 0) throw new InvalidOperationException("Days must be 0 or more.");

        var exists = await _db.PaymentTerms.AnyAsync(x =>
            x.OrganizationId == orgId &&
            (x.Name == name || x.ShortName == shortName) &&
            x.IsActive);
        if (exists) throw new InvalidOperationException("Payment term already exists.");

        var entity = new PaymentTerm
        {
            Id = Guid.NewGuid(),
            OrganizationId = orgId,
            Name = name,
            ShortName = shortName,
            Days = dto.Days,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.PaymentTerms.Add(entity);
        await _db.SaveChangesAsync();
        return ToDto(entity);
    }

    public async Task<PaymentTermDto> UpdateAsync(Guid id, UpdatePaymentTermRequest dto)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var entity = await _db.PaymentTerms.FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId)
            ?? throw new KeyNotFoundException("Payment term not found.");

        var name = dto.Name.Trim();
        var shortName = dto.ShortName.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(name)) throw new InvalidOperationException("Name is required.");
        if (string.IsNullOrWhiteSpace(shortName)) throw new InvalidOperationException("Short name is required.");
        if (dto.Days < 0) throw new InvalidOperationException("Days must be 0 or more.");

        var exists = await _db.PaymentTerms.AnyAsync(x =>
            x.OrganizationId == orgId &&
            x.Id != id &&
            (x.Name == name || x.ShortName == shortName) &&
            x.IsActive);
        if (exists) throw new InvalidOperationException("Payment term already exists.");

        entity.Name = name;
        entity.ShortName = shortName;
        entity.Days = dto.Days;
        entity.IsActive = dto.IsActive;
        entity.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return ToDto(entity);
    }

    public async Task DeleteAsync(Guid id)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var entity = await _db.PaymentTerms.FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId)
            ?? throw new KeyNotFoundException("Payment term not found.");

        entity.IsActive = false;
        entity.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    public async Task<PaymentTermDto> ToggleActiveAsync(Guid id)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var entity = await _db.PaymentTerms.FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId)
            ?? throw new KeyNotFoundException("Payment term not found.");

        entity.IsActive = !entity.IsActive;
        entity.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return ToDto(entity);
    }

    private static PaymentTermDto ToDto(PaymentTerm x) => new(x.Id, x.Name, x.ShortName, x.Days, x.IsActive);
}
