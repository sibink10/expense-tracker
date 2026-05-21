using QubiqonFinanceHub.API.Data;
using QubiqonFinanceHub.API.DTOs;
using QubiqonFinanceHub.API.Models.Constants;
using QubiqonFinanceHub.API.Models.Entities;
using QubiqonFinanceHub.API.Models.Enums;
using QubiqonFinanceHub.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

public class OrganizationService(
    FinanceHubDbContext _db,
    ITenantService _tenant,
    IStorageService _storage)
    : IOrganizationService
{
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
            BankName = dto.BankName?.Trim(),
            IfscCode = dto.IfscCode?.Trim(),
            AccountNumber = dto.AccountNumber?.Trim(),
            BankAddress = dto.BankAddress?.Trim(),
            ZohoSignEmail = dto.ZohoSignEmail?.Trim(),
            IsActive = true,
            UpdatedAt = DateTime.UtcNow
        };

        _db.Organizations.Add(org);
        await _db.SaveChangesAsync();

        var effectiveId = await _tenant.GetEffectiveOrganizationIdAsync();
        return MapToDto(org, org.Id == effectiveId);
    }

    public async Task<OrganizationDto> GetAsync()
    {
        var orgId = await _tenant.GetEffectiveOrganizationIdAsync();
        var org = await _db.Organizations
            .FirstOrDefaultAsync(o => o.Id == orgId)
            ?? throw new KeyNotFoundException("Organization not found.");

        return MapToDto(org, isCurrent: true);
    }

    public async Task<OrganizationDto> GetByIdAsync(Guid id)
    {
        var org = await _db.Organizations.FirstOrDefaultAsync(o => o.Id == id)
                  ?? throw new KeyNotFoundException("Organization not found.");

        var effectiveId = await _tenant.GetEffectiveOrganizationIdAsync();
        var mapped = MapToDto(org, org.Id == effectiveId);
        return org.LogoUrl != null
            ? mapped with { LogoUrl = _storage.GenerateSasUrl(org.LogoUrl) }
            : mapped;
    }

    public async Task<OrganizationDto> UpdateAsync(Guid id, UpdateOrganizationRequest dto)
    {
        var org = await _db.Organizations.FirstOrDefaultAsync(x => x.Id == id)
                  ?? throw new KeyNotFoundException("Organization not found.");

        if (dto.OrgName != null) org.OrgName = dto.OrgName.Trim();
        if (dto.SubName != null) org.SubName = dto.SubName.Trim();
        if (dto.Address != null) org.Address = dto.Address.Trim();
        if (dto.PaymentAddress != null) org.PaymentAddress = dto.PaymentAddress.Trim();
        if (dto.UseSeparatePaymentAddress != null) org.UseSeparatePaymentAddress = dto.UseSeparatePaymentAddress.Value;
        if (dto.Fax != null) org.Fax = dto.Fax.Trim();
        if (dto.City != null) org.City = dto.City.Trim();
        if (dto.State != null) org.State = dto.State.Trim();
        if (dto.Country != null) org.Country = dto.Country.Trim();
        if (dto.PostalCode != null) org.PostalCode = dto.PostalCode.Trim();
        if (dto.Phone != null) org.Phone = dto.Phone.Trim();
        if (dto.Fax != null) org.Fax = dto.Fax.Trim();
        if (dto.Website != null) org.Website = dto.Website.Trim();
        if (dto.Industry != null) org.Industry = dto.Industry.Trim();
        if (dto.BankName != null) org.BankName = dto.BankName.Trim();
        if (dto.IfscCode != null) org.IfscCode = dto.IfscCode.Trim();
        if (dto.AccountNumber != null) org.AccountNumber = dto.AccountNumber.Trim();
        if (dto.BankAddress != null) org.BankAddress = dto.BankAddress.Trim();
        if (dto.ZohoSignEmail != null) org.ZohoSignEmail = string.IsNullOrWhiteSpace(dto.ZohoSignEmail) ? null : dto.ZohoSignEmail.Trim();
        if (dto.Tenant != null) org.Tenant = dto.Tenant;

        if (dto.LogoFile != null)
        {
            if (org.LogoUrl != null)
                await _storage.DeleteAsync(org.LogoUrl);
            org.LogoUrl = await _storage.UploadAsync(StorageFolders.OrgLogo, id, dto.LogoFile);
        }

        org.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        var effectiveId = await _tenant.GetEffectiveOrganizationIdAsync();
        var mapped = MapToDto(org, org.Id == effectiveId);
        return org.LogoUrl != null
            ? mapped with { LogoUrl = _storage.GenerateSasUrl(org.LogoUrl) }
            : mapped;
    }

    public async Task<List<OrganizationDto>> GetAllAsync()
    {
        var currentEmployee = await _tenant.GetCurrentEmployeeAsync();
        var effectiveOrgId = await _tenant.GetEffectiveOrganizationIdAsync();
        var orgsQuery = _db.Organizations.Where(o => o.IsActive);

        if (currentEmployee.Role != UserRole.Admin)
            orgsQuery = orgsQuery.Where(o => o.Id == effectiveOrgId);

        var orgs = await orgsQuery.ToListAsync();
        return orgs.Select(o =>
        {
            var dto = MapToDto(o, o.Id == effectiveOrgId);
            var logoUrl = o.LogoUrl != null ? _storage.GenerateSasUrl(o.LogoUrl) : null;
            return dto with { LogoUrl = logoUrl };
        }).ToList();
    }

    public async Task<OrganizationDto> SelectAsync(Guid id)
    {
        var employee = await _tenant.GetCurrentEmployeeAsync();
        if (employee.Role != UserRole.Admin)
            throw new UnauthorizedAccessException("Only administrators can switch organization context.");

        var targetOrg = await _db.Organizations.FirstOrDefaultAsync(o => o.Id == id && o.IsActive)
                        ?? throw new KeyNotFoundException("Organization not found.");

        var homeOrgId = employee.OrganizationId;
        Guid? activeOrgId = id == homeOrgId ? null : id;

        var context = await _db.EmployeeOrganizationContexts
            .FirstOrDefaultAsync(c => c.EmployeeId == employee.Id);

        if (context == null)
        {
            context = new EmployeeOrganizationContext
            {
                EmployeeId = employee.Id,
                ActiveOrganizationId = activeOrgId,
                UpdatedAt = DateTime.UtcNow
            };
            _db.EmployeeOrganizationContexts.Add(context);
        }
        else
        {
            context.ActiveOrganizationId = activeOrgId;
            context.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();

        employee.OrganizationContext = context;

        var mapped = MapToDto(targetOrg, isCurrent: true);
        return targetOrg.LogoUrl != null
            ? mapped with { LogoUrl = _storage.GenerateSasUrl(targetOrg.LogoUrl) }
            : mapped;
    }

    public Task<Dictionary<string, string>> GetSettingsAsync() =>
        Task.FromResult(new Dictionary<string, string>());

    public Task SetSettingAsync(string key, string value) =>
        Task.CompletedTask;

    private static OrganizationDto MapToDto(Organization o, bool isCurrent) => new(
        o.Id,
        o.OrgName,
        o.SubName,
        o.Tenant,
        isCurrent,
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
        o.Industry,
        o.BankName,
        o.IfscCode,
        o.AccountNumber,
        o.BankAddress,
        o.ZohoSignEmail
    );
}
