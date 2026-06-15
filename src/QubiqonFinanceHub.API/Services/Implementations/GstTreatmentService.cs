using Microsoft.EntityFrameworkCore;
using QubiqonFinanceHub.API.Data;
using QubiqonFinanceHub.API.DTOs;
using QubiqonFinanceHub.API.Models.Entities;
using QubiqonFinanceHub.API.Services.Interfaces;

namespace QubiqonFinanceHub.API.Services.Implementations;

public class GstTreatmentService : IGstTreatmentService
{
    private readonly FinanceHubDbContext _db;

    public GstTreatmentService(FinanceHubDbContext db) => _db = db;

    public async Task<PaginatedResult<GstTreatmentDto>> ListAsync(FilterParams f)
    {
        var q = _db.GstTreatments.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(f.Search))
        {
            var s = f.Search.ToLower();
            q = q.Where(x =>
                x.Code.ToLower().Contains(s) ||
                x.Name.ToLower().Contains(s) ||
                (x.Description != null && x.Description.ToLower().Contains(s)));
        }

        var total = await q.CountAsync();
        q = ApplySorting(q, f);
        var items = await q.Skip((f.Page - 1) * f.PageSize).Take(f.PageSize)
            .Select(x => ToDto(x))
            .ToListAsync();
        return new PaginatedResult<GstTreatmentDto>(items, total, f.Page, f.PageSize);
    }

    public async Task<GstTreatmentDto?> GetByIdAsync(Guid id)
    {
        var entity = await _db.GstTreatments.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
        return entity == null ? null : ToDto(entity);
    }

    public async Task<GstTreatmentDto> CreateAsync(CreateGstTreatmentRequest dto)
    {
        var code = dto.Code.Trim().ToUpperInvariant();
        var name = dto.Name.Trim();
        if (string.IsNullOrWhiteSpace(code)) throw new InvalidOperationException("Code is required.");
        if (string.IsNullOrWhiteSpace(name)) throw new InvalidOperationException("Name is required.");
        if (await _db.GstTreatments.AnyAsync(x => x.Code == code))
            throw new InvalidOperationException("GST treatment code already exists.");

        var entity = new GstTreatment
        {
            Id = Guid.NewGuid(),
            Code = code,
            Name = name,
            Description = dto.Description?.Trim(),
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _db.GstTreatments.Add(entity);
        await _db.SaveChangesAsync();
        return ToDto(entity);
    }

    public async Task<GstTreatmentDto> UpdateAsync(Guid id, UpdateGstTreatmentRequest dto)
    {
        var entity = await _db.GstTreatments.FirstOrDefaultAsync(x => x.Id == id)
            ?? throw new KeyNotFoundException("GST treatment not found.");

        var code = dto.Code.Trim().ToUpperInvariant();
        var name = dto.Name.Trim();
        if (string.IsNullOrWhiteSpace(code)) throw new InvalidOperationException("Code is required.");
        if (string.IsNullOrWhiteSpace(name)) throw new InvalidOperationException("Name is required.");
        if (await _db.GstTreatments.AnyAsync(x => x.Id != id && x.Code == code))
            throw new InvalidOperationException("GST treatment code already exists.");

        entity.Code = code;
        entity.Name = name;
        entity.Description = dto.Description?.Trim();
        entity.IsActive = dto.IsActive;
        entity.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return ToDto(entity);
    }

    public async Task<GstTreatmentDto> ToggleActiveAsync(Guid id)
    {
        var entity = await _db.GstTreatments.FirstOrDefaultAsync(x => x.Id == id)
            ?? throw new KeyNotFoundException("GST treatment not found.");
        entity.IsActive = !entity.IsActive;
        entity.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return ToDto(entity);
    }

    private static IQueryable<GstTreatment> ApplySorting(IQueryable<GstTreatment> q, FilterParams f)
    {
        var desc = f.Desc;
        return (f.SortBy?.ToLowerInvariant()) switch
        {
            "code" => desc ? q.OrderByDescending(x => x.Code) : q.OrderBy(x => x.Code),
            "isactive" => desc ? q.OrderByDescending(x => x.IsActive) : q.OrderBy(x => x.IsActive),
            _ => desc ? q.OrderByDescending(x => x.Name) : q.OrderBy(x => x.Name)
        };
    }

    private static GstTreatmentDto ToDto(GstTreatment x) =>
        new(x.Id, x.Code, x.Name, x.Description, x.IsActive);
}
