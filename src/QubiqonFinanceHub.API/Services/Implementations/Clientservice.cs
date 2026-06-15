using Microsoft.EntityFrameworkCore;
using QubiqonFinanceHub.API.Data;
using QubiqonFinanceHub.API.DTOs;
using QubiqonFinanceHub.API.Models.Entities;
using QubiqonFinanceHub.API.Models.Enums;
using QubiqonFinanceHub.API.Services.Helpers;
using QubiqonFinanceHub.API.Services.Interfaces;

namespace QubiqonFinanceHub.API.Services.Implementations;

public class ClientService : IClientService
{
    private readonly FinanceHubDbContext _db;
    private readonly ITenantService _tenant;

    public ClientService(FinanceHubDbContext db, ITenantService tenant)
    { _db = db; _tenant = tenant; }

    public async Task<ClientFormOptionsDto> GetFormOptionsAsync()
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var gstTreatments = await _db.GstTreatments.AsNoTracking()
            .Where(x => x.IsActive)
            .OrderBy(x => x.Name)
            .Select(x => new GstTreatmentOptionDto(x.Id, x.Code, x.Name, x.Description))
            .ToListAsync();

        var placeOfSupply = await _db.PlaceOfSupply.AsNoTracking()
            .OrderBy(x => x.PlaceOfSupplyName)
            .Select(x => new PlaceOfSupplyOptionDto(
                x.PlaceOfSupplyCode,
                x.PlaceOfSupplyName,
                x.CountryCode,
                x.CountryName,
                x.IsUnionTerritory))
            .ToListAsync();

        var paymentTerms = await _db.PaymentTerms.AsNoTracking()
            .Where(x => x.OrganizationId == orgId && x.IsActive)
            .OrderBy(x => x.Name)
            .Select(x => new PaymentTermOptionDto(x.Id, x.Name, x.ShortName, x.Days, null))
            .ToListAsync();

        return new ClientFormOptionsDto(gstTreatments, placeOfSupply, paymentTerms);
    }

    public async Task<ClientDto> CreateAsync(CreateClientRequest dto)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var nameTrim = (dto.Name ?? "").Trim();
        if (string.IsNullOrWhiteSpace(nameTrim))
            throw new InvalidOperationException("Client name is required.");
        if (await NameExistsAsync(orgId, nameTrim, excludeId: null))
            throw new InvalidOperationException("A client with this name already exists.");

        var gstin = ClientGstValidation.NormalizeGstin(dto.Gstin);
        var pan = ClientGstValidation.NormalizePan(dto.Pan);
        var placeOfSupplyCode = dto.PlaceOfSupplyCode?.Trim()
            ?? ClientGstValidation.StateCodeFromTaxId(gstin);

        ClientGstValidation.Validate(dto.IsTaxable, dto.GstTreatmentId, gstin, placeOfSupplyCode, pan);
        await ValidateForeignKeysAsync(orgId, dto.GstTreatmentId, placeOfSupplyCode, dto.PaymentTermsId);

        var client = new Client
        {
            Id = Guid.NewGuid(),
            OrganizationId = orgId,
            Name = nameTrim,
            Email = dto.Email,
            Country = dto.Country,
            Currency = dto.Currency,
            IsTaxable = dto.IsTaxable,
            GstTreatmentId = dto.GstTreatmentId,
            PlaceOfSupplyCode = placeOfSupplyCode,
            Pan = pan,
            PaymentTermsId = dto.PaymentTermsId,
            CustomerType = Enum.Parse<CustomerType>(dto.CustomerType, true),
            ContactPerson = dto.ContactPerson,
            Phone = dto.Phone,
            GSTIN = gstin,
            BillingAddress = dto.BillingAddress,
            ShippingAddress = dto.ShippingAddress,
            IsActive = true,
            IsDelete = false,
            CreatedAt = DateTime.UtcNow
        };
        _db.Clients.Add(client);
        await _db.SaveChangesAsync();
        return await MapToDtoAsync(client.Id) ?? MapToDto(client);
    }

    public async Task<ClientDto> UpdateAsync(Guid id, UpdateClientRequest dto)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var client = await _db.Clients
            .FirstOrDefaultAsync(c => c.Id == id && c.OrganizationId == orgId)
            ?? throw new KeyNotFoundException("Client not found");
        if (client.IsDelete)
            throw new KeyNotFoundException("Client not found");

        if (dto.Name != null)
        {
            var nameTrim = dto.Name.Trim();
            if (string.IsNullOrWhiteSpace(nameTrim))
                throw new InvalidOperationException("Client name is required.");
            if (await NameExistsAsync(orgId, nameTrim, id))
                throw new InvalidOperationException("A client with this name already exists.");
            client.Name = nameTrim;
        }
        if (dto.Email != null) client.Email = dto.Email;
        if (dto.Country != null) client.Country = dto.Country;
        if (dto.Currency != null) client.Currency = dto.Currency;
        if (dto.IsTaxable.HasValue) client.IsTaxable = dto.IsTaxable.Value;
        if (dto.CustomerType != null) client.CustomerType = Enum.Parse<CustomerType>(dto.CustomerType, true);
        if (dto.ContactPerson != null) client.ContactPerson = dto.ContactPerson;
        if (dto.Phone != null) client.Phone = dto.Phone;
        if (dto.BillingAddress != null) client.BillingAddress = dto.BillingAddress;
        if (dto.ShippingAddress != null) client.ShippingAddress = dto.ShippingAddress;

        var isTaxable = dto.IsTaxable ?? client.IsTaxable;
        var gstTreatmentId = dto.IsTaxable.HasValue ? dto.GstTreatmentId : (dto.GstTreatmentId ?? client.GstTreatmentId);
        var gstin = dto.Gstin != null ? ClientGstValidation.NormalizeGstin(dto.Gstin) : client.GSTIN;
        var pan = dto.Pan != null ? ClientGstValidation.NormalizePan(dto.Pan) : client.Pan;
        var placeOfSupplyCode = dto.PlaceOfSupplyCode != null
            ? (string.IsNullOrWhiteSpace(dto.PlaceOfSupplyCode) ? null : dto.PlaceOfSupplyCode.Trim())
            : (dto.Gstin != null ? ClientGstValidation.StateCodeFromTaxId(gstin) : client.PlaceOfSupplyCode);
        var paymentTermsId = dto.IsTaxable.HasValue ? dto.PaymentTermsId : (dto.PaymentTermsId ?? client.PaymentTermsId);

        if (dto.IsTaxable.HasValue)
        {
            ClientGstValidation.Validate(isTaxable, gstTreatmentId, gstin, placeOfSupplyCode, pan);
            await ValidateForeignKeysAsync(orgId, gstTreatmentId, placeOfSupplyCode, paymentTermsId);
            client.IsTaxable = isTaxable;
            client.GstTreatmentId = gstTreatmentId;
            client.GSTIN = gstin;
            client.PlaceOfSupplyCode = placeOfSupplyCode;
            client.Pan = pan;
            client.PaymentTermsId = paymentTermsId;
        }
        else if (dto.GstTreatmentId != null || dto.Gstin != null || dto.PlaceOfSupplyCode != null || dto.Pan != null || dto.PaymentTermsId != null)
        {
            gstTreatmentId = dto.GstTreatmentId ?? client.GstTreatmentId;
            paymentTermsId = dto.PaymentTermsId ?? client.PaymentTermsId;
            ClientGstValidation.Validate(isTaxable, gstTreatmentId, gstin, placeOfSupplyCode, pan);
            await ValidateForeignKeysAsync(orgId, gstTreatmentId, placeOfSupplyCode, paymentTermsId);
            if (dto.GstTreatmentId != null) client.GstTreatmentId = dto.GstTreatmentId;
            if (dto.Gstin != null) client.GSTIN = gstin;
            if (dto.PlaceOfSupplyCode != null || dto.Gstin != null) client.PlaceOfSupplyCode = placeOfSupplyCode;
            if (dto.Pan != null) client.Pan = pan;
            if (dto.PaymentTermsId != null) client.PaymentTermsId = dto.PaymentTermsId;
        }

        client.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return await MapToDtoAsync(client.Id) ?? MapToDto(client);
    }

    public async Task<ClientDto?> GetByIdAsync(Guid id)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        return await MapToDtoAsync(id, orgId);
    }

    public async Task<PaginatedResult<ClientDto>> ListAsync(FilterParams f)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var q = _db.Clients
            .Where(c => c.OrganizationId == orgId && !c.IsDelete)
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(f.Search))
        {
            var s = f.Search.ToLower();
            q = q.Where(x => x.Name.ToLower().Contains(s) ||
                             x.Email.ToLower().Contains(s));
        }

        var total = await q.CountAsync();
        q = q.ApplyClientSorting(f);
        var ids = await q.Skip((f.Page - 1) * f.PageSize).Take(f.PageSize).Select(c => c.Id).ToListAsync();
        var items = new List<ClientDto>();
        foreach (var clientId in ids)
        {
            var dto = await MapToDtoAsync(clientId, orgId);
            if (dto != null) items.Add(dto);
        }

        return new PaginatedResult<ClientDto>(items, total, f.Page, f.PageSize);
    }

    public async Task DeleteAsync(Guid id)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var client = await _db.Clients
            .FirstOrDefaultAsync(c => c.Id == id && c.OrganizationId == orgId)
            ?? throw new KeyNotFoundException("Client not found");
        if (client.IsDelete) return;
        client.IsDelete = true;
        client.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    private async Task<bool> NameExistsAsync(Guid orgId, string nameTrim, Guid? excludeId)
    {
        var lower = nameTrim.ToLowerInvariant();
        return await _db.Clients.AnyAsync(x =>
            x.OrganizationId == orgId &&
            !x.IsDelete &&
            (excludeId == null || x.Id != excludeId.Value) &&
            x.Name.ToLower() == lower);
    }

    private async Task ValidateForeignKeysAsync(Guid orgId, Guid? gstTreatmentId, string? placeOfSupplyCode, Guid? paymentTermsId)
    {
        if (gstTreatmentId.HasValue)
        {
            var ok = await _db.GstTreatments.AnyAsync(x => x.Id == gstTreatmentId.Value && x.IsActive);
            if (!ok) throw new InvalidOperationException("Invalid GST treatment.");
        }

        if (!string.IsNullOrWhiteSpace(placeOfSupplyCode))
        {
            var code = placeOfSupplyCode.Trim();
            var ok = await _db.PlaceOfSupply.AnyAsync(x => x.PlaceOfSupplyCode == code);
            if (!ok) throw new InvalidOperationException("Invalid place of supply.");
        }

        if (paymentTermsId.HasValue)
        {
            var ok = await _db.PaymentTerms.AnyAsync(x =>
                x.Id == paymentTermsId.Value && x.OrganizationId == orgId && x.IsActive);
            if (!ok) throw new InvalidOperationException("Invalid payment terms.");
        }
    }

    private async Task<ClientDto?> MapToDtoAsync(Guid id, Guid? orgId = null)
    {
        orgId ??= await _tenant.GetCurrentOrganizationId();
        return await _db.Clients.AsNoTracking()
            .Where(c => c.Id == id && c.OrganizationId == orgId && !c.IsDelete)
            .Select(c => new ClientDto(
                c.Id,
                c.Name,
                c.Email,
                c.Country,
                c.Currency,
                c.IsTaxable,
                c.CustomerType.ToString(),
                c.ContactPerson,
                c.Phone,
                c.GSTIN,
                c.GstTreatmentId,
                c.GstTreatment != null ? c.GstTreatment.Name : null,
                c.PlaceOfSupplyCode,
                c.PlaceOfSupply != null ? c.PlaceOfSupply.PlaceOfSupplyName : null,
                c.Pan,
                c.PaymentTermsId,
                c.PaymentTerm != null ? c.PaymentTerm.Name : null,
                c.BillingAddress,
                c.ShippingAddress,
                c.IsActive,
                c.CreatedAt))
            .FirstOrDefaultAsync();
    }

    private static ClientDto MapToDto(Client c) => new(
        c.Id,
        c.Name,
        c.Email,
        c.Country,
        c.Currency,
        c.IsTaxable,
        c.CustomerType.ToString(),
        c.ContactPerson,
        c.Phone,
        c.GSTIN,
        c.GstTreatmentId,
        null,
        c.PlaceOfSupplyCode,
        null,
        c.Pan,
        c.PaymentTermsId,
        null,
        c.BillingAddress,
        c.ShippingAddress,
        c.IsActive,
        c.CreatedAt
    );
}
