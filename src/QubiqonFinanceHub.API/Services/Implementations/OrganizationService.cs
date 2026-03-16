using QubiqonFinanceHub.API.Data;
using QubiqonFinanceHub.API.DTOs;
using QubiqonFinanceHub.API.Models.Constants;
using QubiqonFinanceHub.API.Models.Entities;
using QubiqonFinanceHub.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

public class OrganizationService(
    FinanceHubDbContext _db,
    ITenantService _tenant,
    IStorageService _storage)
    : IOrganizationService
{
    // ── Create ────────────────────────────────────────────────────────────
    public async Task<OrganizationDto> CreateAsync(CreateOrganizationRequest dto)
    {
        var orgId = Guid.NewGuid();

        var logoUrl = dto.LogoFile != null
            ? await _storage.UploadAsync(StorageFolders.OrgLogo, orgId, dto.LogoFile)
            : null;

        var org = new Organization
        {
            Id = orgId,
            OrgName = dto.OrgName.Trim(),
            SubName = dto.SubName?.Trim(),
            Tenant = dto.Tenant,
            Selected = dto.Selected ?? false,

            LogoUrl = logoUrl,

            Address = dto.Address?.Trim(),
            PaymentAddress = dto.PaymentAddress?.Trim(),
            UseSeparatePaymentAddress = dto.UseSeparatePaymentAddress ?? false,

            City = dto.City?.Trim(),
            State = dto.State?.Trim(),
            Country = dto.Country?.Trim() ?? "India",
            PostalCode = dto.PostalCode?.Trim(),

            Phone = dto.Phone?.Trim(),
            Fax = dto.Fax?.Trim(),
            Website = dto.Website?.Trim(),

            Industry = dto.Industry?.Trim(),

            IsActive = true,
            UpdatedAt = DateTime.UtcNow
        };

        _db.Organizations.Add(org);
        await _db.SaveChangesAsync();

        return MapToDto(org);
    }

    // ── Get ───────────────────────────────────────────────────────────────
    public async Task<OrganizationDto> GetAsync()
    {
        var orgId = await _tenant.GetCurrentOrganizationId();

        var org = await _db.Organizations
            .FirstOrDefaultAsync(o => o.Id == orgId)
            ?? throw new KeyNotFoundException("Organization not found.");

        return MapToDto(org);
    }

    // ── Get by id ───────────────────────────────────────────────────────────────
    public async Task<OrganizationDto> GetByIdAsync(Guid id)
    {
        var org = await _db.Organizations.FirstOrDefaultAsync(o => o.Id == id)
                  ?? throw new KeyNotFoundException("Organization not found.");

        var mapped = MapToDto(org);
        return org.LogoUrl != null
            ? mapped with { LogoUrl = _storage.GenerateSasUrl(org.LogoUrl) }
            : mapped;
    }

    // ── Update ────────────────────────────────────────────────────────────
    public async Task<OrganizationDto> UpdateAsync(Guid id, UpdateOrganizationRequest dto)
    {
        var org = await _db.Organizations.FirstOrDefaultAsync(x => x.Id == id)
                  ?? throw new KeyNotFoundException("Organization not found.");

        if (dto.OrgName != null) org.OrgName = dto.OrgName.Trim();
        if (dto.SubName != null) org.SubName = dto.SubName.Trim();
        if (dto.Address != null) org.Address = dto.Address.Trim();
        if (dto.PaymentAddress != null) org.PaymentAddress = dto.PaymentAddress.Trim();
        if (dto.UseSeparatePaymentAddress != null) org.UseSeparatePaymentAddress = dto.UseSeparatePaymentAddress.Value;
        if (dto.City != null) org.City = dto.City.Trim();
        if (dto.State != null) org.State = dto.State.Trim();
        if (dto.Country != null) org.Country = dto.Country.Trim();
        if (dto.PostalCode != null) org.PostalCode = dto.PostalCode.Trim();
        if (dto.Phone != null) org.Phone = dto.Phone.Trim();
        if (dto.Fax != null) org.Fax = dto.Fax.Trim();
        if (dto.Website != null) org.Website = dto.Website.Trim();
        if (dto.Industry != null) org.Industry = dto.Industry.Trim();
        if (dto.Tenant != null) org.Tenant = dto.Tenant;
        if (dto.Selected != null) org.Selected = dto.Selected.Value;

        if (dto.LogoFile != null)
        {
            if (org.LogoUrl != null)
                await _storage.DeleteAsync(org.LogoUrl);
            org.LogoUrl = await _storage.UploadAsync(StorageFolders.OrgLogo, id, dto.LogoFile);
        }

        org.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        var mapped = MapToDto(org);
        return org.LogoUrl != null
            ? mapped with { LogoUrl = _storage.GenerateSasUrl(org.LogoUrl) }
            : mapped;
    }

    public async Task<List<OrganizationDto>> GetAllAsync()
    {
        var orgs = await _db.Organizations.Where(o => o.IsActive).ToListAsync();
        return orgs.Select(o =>
        {
            var dto = MapToDto(o);
            var logoUrl = o.LogoUrl != null ? _storage.GenerateSasUrl(o.LogoUrl) : null;
            return dto with { LogoUrl = logoUrl };  // replace stored URL with SAS URL
        }).ToList();
    }

    public async Task<OrganizationDto> SelectAsync(Guid id)
    {
        // Deselect all first, then select the chosen one
        await _db.Organizations.ExecuteUpdateAsync(o =>
            o.SetProperty(x => x.Selected, false));

        var org = await _db.Organizations.FirstOrDefaultAsync(x => x.Id == id)
                  ?? throw new KeyNotFoundException("Organization not found.");

        org.Selected = true;
        org.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        var mapped = MapToDto(org);
        return org.LogoUrl != null
            ? mapped with { LogoUrl = _storage.GenerateSasUrl(org.LogoUrl) }
            : mapped;
    }

    // ── Settings (stubs) ──────────────────────────────────────────────────
    public Task<Dictionary<string, string>> GetSettingsAsync() =>
        Task.FromResult(new Dictionary<string, string>());

    public Task SetSettingAsync(string key, string value) =>
        Task.CompletedTask;

    // ── Mapper ────────────────────────────────────────────────────────────
    private static OrganizationDto MapToDto(Organization o) => new(
        o.Id,
        o.OrgName,
        o.SubName,
        o.Tenant,
        o.Selected,
        o.LogoUrl,
        o.Address,
        o.PaymentAddress,
        o.UseSeparatePaymentAddress,
        o.City,
        o.State,
        o.Country,
        o.PostalCode,
        o.Phone,
        o.Fax,
        o.Website,
        o.Industry
    );
}