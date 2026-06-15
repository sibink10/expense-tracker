using Microsoft.EntityFrameworkCore;
using QubiqonFinanceHub.API.Data;
using QubiqonFinanceHub.API.DTOs;
using QubiqonFinanceHub.API.Models.Entities;
using QubiqonFinanceHub.API.Services.Interfaces;

namespace QubiqonFinanceHub.API.Services.Implementations;

public class PlaceOfSupplyService : IPlaceOfSupplyService
{
    private readonly FinanceHubDbContext _db;

    public PlaceOfSupplyService(FinanceHubDbContext db) => _db = db;

    public async Task<PaginatedResult<PlaceOfSupplyDto>> ListAsync(FilterParams f)
    {
        var q = _db.PlaceOfSupply.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(f.Search))
        {
            var s = f.Search.ToLower();
            q = q.Where(x =>
                x.PlaceOfSupplyCode.ToLower().Contains(s) ||
                x.PlaceOfSupplyName.ToLower().Contains(s) ||
                x.CountryName.ToLower().Contains(s));
        }

        var total = await q.CountAsync();
        q = ApplySorting(q, f);
        var items = await q.Skip((f.Page - 1) * f.PageSize).Take(f.PageSize)
            .Select(x => ToDto(x))
            .ToListAsync();
        return new PaginatedResult<PlaceOfSupplyDto>(items, total, f.Page, f.PageSize);
    }

    public async Task<PlaceOfSupplyDto?> GetByCodeAsync(string code)
    {
        var normalized = code.Trim();
        var entity = await _db.PlaceOfSupply.AsNoTracking()
            .FirstOrDefaultAsync(x => x.PlaceOfSupplyCode == normalized);
        return entity == null ? null : ToDto(entity);
    }

    public async Task<PlaceOfSupplyDto> CreateAsync(CreatePlaceOfSupplyRequest dto)
    {
        var code = dto.Code.Trim();
        var name = dto.Name.Trim();
        if (code.Length != 2 || !code.All(char.IsDigit))
            throw new InvalidOperationException("Place of supply code must be a 2-digit state code.");
        if (string.IsNullOrWhiteSpace(name))
            throw new InvalidOperationException("Name is required.");
        if (await _db.PlaceOfSupply.AnyAsync(x => x.PlaceOfSupplyCode == code))
            throw new InvalidOperationException("Place of supply code already exists.");

        var entity = new PlaceOfSupply
        {
            PlaceOfSupplyCode = code,
            PlaceOfSupplyName = name,
            CountryCode = dto.CountryCode.Trim().ToUpperInvariant(),
            CountryName = dto.CountryName.Trim(),
            IsUnionTerritory = dto.IsUnionTerritory
        };
        _db.PlaceOfSupply.Add(entity);
        await _db.SaveChangesAsync();
        return ToDto(entity);
    }

    public async Task<PlaceOfSupplyDto> UpdateAsync(string code, UpdatePlaceOfSupplyRequest dto)
    {
        var normalized = code.Trim();
        var entity = await _db.PlaceOfSupply.FirstOrDefaultAsync(x => x.PlaceOfSupplyCode == normalized)
            ?? throw new KeyNotFoundException("Place of supply not found.");

        var name = dto.Name.Trim();
        if (string.IsNullOrWhiteSpace(name))
            throw new InvalidOperationException("Name is required.");

        entity.PlaceOfSupplyName = name;
        entity.CountryCode = dto.CountryCode.Trim().ToUpperInvariant();
        entity.CountryName = dto.CountryName.Trim();
        entity.IsUnionTerritory = dto.IsUnionTerritory;
        await _db.SaveChangesAsync();
        return ToDto(entity);
    }

    public async Task DeleteAsync(string code)
    {
        var normalized = code.Trim();
        var inUse = await _db.Clients.AnyAsync(x => x.PlaceOfSupplyCode == normalized);
        if (inUse) throw new InvalidOperationException("Place of supply is in use by clients.");

        var entity = await _db.PlaceOfSupply.FirstOrDefaultAsync(x => x.PlaceOfSupplyCode == normalized)
            ?? throw new KeyNotFoundException("Place of supply not found.");
        _db.PlaceOfSupply.Remove(entity);
        await _db.SaveChangesAsync();
    }

    private static IQueryable<PlaceOfSupply> ApplySorting(IQueryable<PlaceOfSupply> q, FilterParams f)
    {
        var desc = f.Desc;
        return (f.SortBy?.ToLowerInvariant()) switch
        {
            "code" => desc ? q.OrderByDescending(x => x.PlaceOfSupplyCode) : q.OrderBy(x => x.PlaceOfSupplyCode),
            "countryname" => desc ? q.OrderByDescending(x => x.CountryName) : q.OrderBy(x => x.CountryName),
            "isunionterritory" => desc ? q.OrderByDescending(x => x.IsUnionTerritory) : q.OrderBy(x => x.IsUnionTerritory),
            _ => desc ? q.OrderByDescending(x => x.PlaceOfSupplyName) : q.OrderBy(x => x.PlaceOfSupplyName)
        };
    }

    private static PlaceOfSupplyDto ToDto(PlaceOfSupply x) =>
        new(x.PlaceOfSupplyCode, x.PlaceOfSupplyName, x.CountryCode, x.CountryName, x.IsUnionTerritory);
}
