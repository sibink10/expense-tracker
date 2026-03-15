using QubiqonFinanceHub.API.Data;
using QubiqonFinanceHub.API.DTOs;
using QubiqonFinanceHub.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace QubiqonFinanceHub.API.Services.Implementations;

public class OrganizationService : IOrganizationService
{
    private readonly FinanceHubDbContext _db;
    private readonly ITenantService _tenant;

    public OrganizationService(FinanceHubDbContext db, ITenantService tenant)
    {
        _db = db;
        _tenant = tenant;
    }

    public async Task<OrganizationDto> GetAsync()
    {
        var orgId = _tenant.GetCurrentOrganizationId();
        var org = await _db.Organizations.FirstOrDefaultAsync(o => o.Id == orgId);

        return new OrganizationDto(
            org?.Id ?? Guid.Empty,  // Id
            org?.Name ?? "Dev Org", // Name
            null,                   // LegalName
            org?.Slug ?? "dev",     // Slug
            null,                   // LogoUrl
            null,                   // PrimaryColor
            null,                   // AccentColor
            null,                   // AddressLine1
            null,                   // AddressLine2
            null,                   // City
            null,                   // State
            null,                   // Country
            null,                   // PinCode
            null,                   // GSTIN
            null,                   // PAN
            null,                   // CIN
            null,                   // TAN
            null,                   // ContactPersonName
            null,                   // ContactEmail
            null,                   // ContactPhone
            null,                   // Website
            null,                   // BankAccountName
            null,                   // BankAccountNumber
            null,                   // BankIFSC
            null,                   // BankName
            null,                   // BankBranch
            null                    // BankSWIFT
        );
    }

    public Task<OrganizationDto> UpdateAsync(UpdateOrganizationRequest dto) => throw new NotImplementedException();
    public Task<Dictionary<string, string>> GetSettingsAsync() => Task.FromResult(new Dictionary<string, string>());
    public Task SetSettingAsync(string key, string value) => Task.CompletedTask;
}