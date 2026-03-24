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

    public async Task<ClientDto> CreateAsync(CreateClientRequest dto)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var nameTrim = (dto.Name ?? "").Trim();
        if (string.IsNullOrWhiteSpace(nameTrim))
            throw new InvalidOperationException("Client name is required.");
        if (await NameExistsAsync(orgId, nameTrim, excludeId: null))
            throw new InvalidOperationException("A client with this name already exists.");

        var client = new Client
        {
            Id = Guid.NewGuid(),
            OrganizationId = orgId,
            Name = nameTrim,
            Email = dto.Email,
            Country = dto.Country,
            Currency = dto.Currency,
            TaxType = dto.TaxType,
            CustomerType = Enum.Parse<CustomerType>(dto.CustomerType, true),
            ContactPerson = dto.ContactPerson,
            Phone = dto.Phone,
            GSTIN = dto.GSTIN,
            BillingAddress = dto.BillingAddress,
            ShippingAddress = dto.ShippingAddress,
            IsActive = true,
            IsDelete = false,
            CreatedAt = DateTime.UtcNow
        };
        _db.Clients.Add(client);
        await _db.SaveChangesAsync();
        return MapToDto(client);
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
        if (dto.TaxType != null) client.TaxType = dto.TaxType;
        if (dto.CustomerType != null) client.CustomerType = Enum.Parse<CustomerType>(dto.CustomerType, true);
        if (dto.ContactPerson != null) client.ContactPerson = dto.ContactPerson;
        if (dto.Phone != null) client.Phone = dto.Phone;
        if (dto.GSTIN != null) client.GSTIN = dto.GSTIN;
        if (dto.BillingAddress != null) client.BillingAddress = dto.BillingAddress;
        if (dto.ShippingAddress != null) client.ShippingAddress = dto.ShippingAddress;
        client.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return MapToDto(client);
    }

    public async Task<ClientDto?> GetByIdAsync(Guid id)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var client = await _db.Clients.AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id && c.OrganizationId == orgId && !c.IsDelete);
        return client == null ? null : MapToDto(client);
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
        var items = await q.Skip((f.Page - 1) * f.PageSize).Take(f.PageSize).ToListAsync();

        return new PaginatedResult<ClientDto>(items.Select(MapToDto).ToList(), total, f.Page, f.PageSize);
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

    private static ClientDto MapToDto(Client c) => new(
     c.Id,
     c.Name,
     c.Email,
     c.Country,
     c.Currency,
     c.TaxType.ToString(),
     c.CustomerType.ToString(),
     c.ContactPerson,
     c.Phone,
     c.GSTIN,
     c.BillingAddress,
     c.ShippingAddress,
     c.IsActive,
     c.CreatedAt
 );
}