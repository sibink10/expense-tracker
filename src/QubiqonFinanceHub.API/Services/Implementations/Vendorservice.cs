using Microsoft.EntityFrameworkCore;
using QubiqonFinanceHub.API.Data;
using QubiqonFinanceHub.API.DTOs;
using QubiqonFinanceHub.API.Models.Entities;
using QubiqonFinanceHub.API.Services.Interfaces;

namespace QubiqonFinanceHub.API.Services.Implementations;

public class VendorService : IVendorService
{
    private readonly FinanceHubDbContext _db;
    private readonly ITenantService _tenant;

    public VendorService(FinanceHubDbContext db, ITenantService tenant)
    { _db = db; _tenant = tenant; }

    public async Task<VendorDto> CreateAsync(CreateVendorRequest dto)
    {
        var orgId = _tenant.GetCurrentOrganizationId();
        var vendor = new Vendor
        {
            Id = Guid.NewGuid(),
            OrganizationId = orgId,
            Name = dto.Name,
            GSTIN = dto.GSTIN,
            Email = dto.Email,
            Phone = dto.Phone,
            Category = dto.Category,
            Address = dto.Address,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        _db.Vendors.Add(vendor);
        await _db.SaveChangesAsync();
        return MapToDto(vendor);
    }

    public async Task<VendorDto> UpdateAsync(Guid id, UpdateVendorRequest dto)
    {
        var orgId = _tenant.GetCurrentOrganizationId();
        var vendor = await _db.Vendors
            .FirstOrDefaultAsync(v => v.Id == id && v.OrganizationId == orgId)
            ?? throw new KeyNotFoundException("Vendor not found");

        if (dto.Name != null) vendor.Name = dto.Name;
        if (dto.GSTIN != null) vendor.GSTIN = dto.GSTIN;
        if (dto.Email != null) vendor.Email = dto.Email;
        if (dto.Phone != null) vendor.Phone = dto.Phone;
        if (dto.Category != null) vendor.Category = dto.Category;
        if (dto.Address != null) vendor.Address = dto.Address;

        await _db.SaveChangesAsync();
        return MapToDto(vendor);
    }

    public async Task<VendorDto?> GetByIdAsync(Guid id)
    {
        var orgId = _tenant.GetCurrentOrganizationId();
        var vendor = await _db.Vendors.AsNoTracking()
            .FirstOrDefaultAsync(v => v.Id == id && v.OrganizationId == orgId);
        return vendor == null ? null : MapToDto(vendor);
    }

    public async Task<List<VendorDto>> ListAsync()
    {
        var orgId = _tenant.GetCurrentOrganizationId();
        var vendors = await _db.Vendors
            .Where(v => v.OrganizationId == orgId)
            .OrderBy(v => v.Name)
            .AsNoTracking()
            .ToListAsync();
        return vendors.Select(MapToDto).ToList();
    }

    private static VendorDto MapToDto(Vendor v) => new(
        v.Id, v.Name, v.GSTIN, v.Email, v.Phone, v.Category, v.Address, v.IsActive
    );
}