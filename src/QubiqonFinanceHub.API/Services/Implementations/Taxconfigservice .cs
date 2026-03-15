using Microsoft.EntityFrameworkCore;
using QubiqonFinanceHub.API.Data;
using QubiqonFinanceHub.API.DTOs;
using QubiqonFinanceHub.API.Models.Entities;
using QubiqonFinanceHub.API.Models.Enums;
using QubiqonFinanceHub.API.Services.Interfaces;

namespace QubiqonFinanceHub.API.Services.Implementations;

public class TaxConfigService : ITaxConfigService
{
    private readonly FinanceHubDbContext _db;
    private readonly ITenantService _tenant;

    public TaxConfigService(FinanceHubDbContext db, ITenantService tenant)
    { _db = db; _tenant = tenant; }

    public async Task<TaxConfigDto> CreateAsync(CreateTaxConfigRequest dto)
    {
        var orgId = _tenant.GetCurrentOrganizationId();

        var tax = new TaxConfiguration
        {
            Id = Guid.NewGuid(),
            OrganizationId = orgId,
            Type = Enum.Parse<TaxType>(dto.Type, true),
            Name = dto.Name,
            Rate = dto.Rate,
            Section = dto.Section,
            SubType = dto.SubType,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _db.TaxConfigurations.Add(tax);
        await _db.SaveChangesAsync();
        return MapToDto(tax);
    }

    public async Task<List<TaxConfigDto>> ListAsync(string? type = null)
    {
        var orgId = _tenant.GetCurrentOrganizationId();
        var q = _db.TaxConfigurations
            .Where(t => t.OrganizationId == orgId)
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(type) && Enum.TryParse<TaxType>(type, true, out var taxType))
            q = q.Where(t => t.Type == taxType);

        var items = await q.OrderBy(t => t.Name).ToListAsync();
        return items.Select(MapToDto).ToList();
    }

    public async Task<TaxConfigDto> ToggleActiveAsync(Guid id)
    {
        var orgId = _tenant.GetCurrentOrganizationId();
        var tax = await _db.TaxConfigurations
            .FirstOrDefaultAsync(t => t.Id == id && t.OrganizationId == orgId)
            ?? throw new KeyNotFoundException("Tax config not found");

        tax.IsActive = !tax.IsActive;
        await _db.SaveChangesAsync();
        return MapToDto(tax);
    }

    private static TaxConfigDto MapToDto(TaxConfiguration t) => new(
        t.Id, t.Type.ToString(), t.Name, t.Rate, t.Section, t.SubType, t.IsActive
    );
}