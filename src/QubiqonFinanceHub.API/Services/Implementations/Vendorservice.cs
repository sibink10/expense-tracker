using Microsoft.EntityFrameworkCore;
using QubiqonFinanceHub.API.Data;
using QubiqonFinanceHub.API.DTOs;
using QubiqonFinanceHub.API.Models.Entities;
using QubiqonFinanceHub.API.Services.Helpers;
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
        var orgId = await _tenant.GetCurrentOrganizationId();
        var vendor = new Vendor
        {
            Id = Guid.NewGuid(),
            OrganizationId = orgId,
            Name = dto.Name,
            Email = dto.Email,
            Address = dto.Address,
            Phone = dto.Phone,
            Category = dto.Category,
            GSTIN = dto.GSTIN,
            ContactPerson = dto.ContactPerson,
            BankName = dto.BankName,
            AccountNumber = dto.AccountNumber,
            IfscCode = dto.IfscCode,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        _db.Vendors.Add(vendor);
        await _db.SaveChangesAsync();
        return MapToDto(vendor);
    }

    public async Task<VendorDto> UpdateAsync(Guid id, UpdateVendorRequest dto)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var vendor = await _db.Vendors
            .FirstOrDefaultAsync(v => v.Id == id && v.OrganizationId == orgId)
            ?? throw new KeyNotFoundException("Vendor not found");

        if (dto.Name != null) vendor.Name = dto.Name;
        if (dto.Email != null) vendor.Email = dto.Email;
        if (dto.Address != null) vendor.Address = dto.Address;
        if (dto.Phone != null) vendor.Phone = dto.Phone;
        if (dto.Category != null) vendor.Category = dto.Category;
        if (dto.GSTIN != null) vendor.GSTIN = dto.GSTIN;
        if (dto.ContactPerson != null) vendor.ContactPerson = dto.ContactPerson;
        if (dto.BankName != null) vendor.BankName = dto.BankName;
        if (dto.AccountNumber != null) vendor.AccountNumber = dto.AccountNumber;
        if (dto.IfscCode != null) vendor.IfscCode = dto.IfscCode;
        vendor.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return MapToDto(vendor);
    }

    public async Task<VendorDto?> GetByIdAsync(Guid id)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var vendor = await _db.Vendors.AsNoTracking()
            .FirstOrDefaultAsync(v => v.Id == id && v.OrganizationId == orgId);
        return vendor == null ? null : MapToDto(vendor);
    }

    public async Task<PaginatedResult<VendorDto>> ListAsync(FilterParams f)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var q = _db.Vendors
            .Where(v => v.OrganizationId == orgId)
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(f.Search))
        {
            var s = f.Search.ToLower();
            q = q.Where(x => x.Name.ToLower().Contains(s) ||
                             x.Email.ToLower().Contains(s));
        }

        var total = await q.CountAsync();
        q = q.ApplyVendorSorting(f);
        var items = await q.Skip((f.Page - 1) * f.PageSize).Take(f.PageSize).ToListAsync();

        return new PaginatedResult<VendorDto>(items.Select(MapToDto).ToList(), total, f.Page, f.PageSize);
    }

    private static VendorDto MapToDto(Vendor v) => new(
     v.Id,
     v.Name,
     v.Email,
     v.Address,
     v.Phone,
     v.Category,
     v.GSTIN,
     v.ContactPerson,
     v.BankName,
     v.AccountNumber,
     v.IfscCode,
     v.IsActive,
     v.CreatedAt
 );
}