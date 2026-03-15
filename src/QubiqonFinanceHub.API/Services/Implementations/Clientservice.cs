using Microsoft.EntityFrameworkCore;
using QubiqonFinanceHub.API.Data;
using QubiqonFinanceHub.API.DTOs;
using QubiqonFinanceHub.API.Models.Entities;
using QubiqonFinanceHub.API.Models.Enums;
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
        var orgId = _tenant.GetCurrentOrganizationId();
        var client = new Client
        {
            Id = Guid.NewGuid(),
            OrganizationId = orgId,
            Name = dto.Name,
            ContactPerson = dto.ContactPerson,
            Email = dto.Email,
            Phone = dto.Phone,
            Country = dto.Country,
            Currency = dto.Currency,
            TaxType = Enum.Parse<ClientTaxType>(dto.TaxType, true),
            GSTIN = dto.GSTIN,
            Address = dto.Address,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        _db.Clients.Add(client);
        await _db.SaveChangesAsync();
        return MapToDto(client);
    }

    public async Task<ClientDto> UpdateAsync(Guid id, UpdateClientRequest dto)
    {
        var orgId = _tenant.GetCurrentOrganizationId();
        var client = await _db.Clients
            .FirstOrDefaultAsync(c => c.Id == id && c.OrganizationId == orgId)
            ?? throw new KeyNotFoundException("Client not found");

        if (dto.Name != null) client.Name = dto.Name;
        if (dto.ContactPerson != null) client.ContactPerson = dto.ContactPerson;
        if (dto.Email != null) client.Email = dto.Email;
        if (dto.Phone != null) client.Phone = dto.Phone;
        if (dto.Country != null) client.Country = dto.Country;
        if (dto.Currency != null) client.Currency = dto.Currency;
        if (dto.TaxType != null) client.TaxType = Enum.Parse<ClientTaxType>(dto.TaxType, true);
        if (dto.GSTIN != null) client.GSTIN = dto.GSTIN;
        if (dto.Address != null) client.Address = dto.Address;

        await _db.SaveChangesAsync();
        return MapToDto(client);
    }

    public async Task<ClientDto?> GetByIdAsync(Guid id)
    {
        var orgId = _tenant.GetCurrentOrganizationId();
        var client = await _db.Clients.AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id && c.OrganizationId == orgId);
        return client == null ? null : MapToDto(client);
    }

    public async Task<List<ClientDto>> ListAsync()
    {
        var orgId = _tenant.GetCurrentOrganizationId();
        var clients = await _db.Clients
            .Where(c => c.OrganizationId == orgId)
            .OrderBy(c => c.Name)
            .AsNoTracking()
            .ToListAsync();
        return clients.Select(MapToDto).ToList();
    }

    private static ClientDto MapToDto(Client c) => new(
        c.Id, c.Name, c.ContactPerson, c.Email, c.Phone,
        c.Country, c.Currency, c.TaxType.ToString(),
        c.GSTIN, c.Address, c.IsActive
    );
}