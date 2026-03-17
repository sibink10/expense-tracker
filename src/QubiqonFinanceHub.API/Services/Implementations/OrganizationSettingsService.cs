using Microsoft.EntityFrameworkCore;
using QubiqonFinanceHub.API.Data;
using QubiqonFinanceHub.API.DTOs;
using QubiqonFinanceHub.API.Models.Entities;
using QubiqonFinanceHub.API.Services.Interfaces;

namespace QubiqonFinanceHub.API.Services.Implementations
{
    public class OrganizationSettingsService : IOrganizationSettingsService
    {
        private readonly FinanceHubDbContext _db;
        private readonly ITenantService _tenant;

        public OrganizationSettingsService(FinanceHubDbContext db, ITenantService tenant)
        {
            _db = db;
            _tenant = tenant;
        }

        public async Task<Dictionary<string, SettingDto>> GetSettingsAsync()
        {
            var orgId = await _tenant.GetCurrentOrganizationId();

            return await _db.OrganizationSettings
                .Where(s => s.OrganizationId == orgId)
                .AsNoTracking()
                .ToDictionaryAsync(
                    s => s.Key,
                    s => new SettingDto
                    {
                        Id = s.Id,
                        Value = s.Value
                    }
                );
        }

        public async Task SetSettingAsync(string key, string value)
        {
            var orgId = await _tenant.GetCurrentOrganizationId();
            var setting = await _db.OrganizationSettings
                .FirstOrDefaultAsync(s => s.OrganizationId == orgId && s.Key == key);

            if (setting == null)
            {
                _db.OrganizationSettings.Add(new OrganizationSetting
                {
                    Id = Guid.NewGuid(),
                    OrganizationId = orgId,
                    Key = key,
                    Value = value,
                    UpdatedAt = DateTime.UtcNow
                });
            }
            else
            {
                setting.Value = value;
                setting.UpdatedAt = DateTime.UtcNow;
            }

            await _db.SaveChangesAsync();
        }

        public async Task BulkSetSettingsAsync(List<BulkSettingItemDto> settings)
        {
            var orgId = await _tenant.GetCurrentOrganizationId();

            // Load all existing settings once (IMPORTANT: avoid N queries)
            var existingSettings = await _db.OrganizationSettings
                .Where(s => s.OrganizationId == orgId)
                .ToListAsync();

            var settingsDict = existingSettings.ToDictionary(s => s.Key, s => s);

            foreach (var item in settings)
            {
                if (item.Key == "advCap")
                {
                    var newAdvCap = decimal.Parse(item.Value);

                    settingsDict.TryGetValue("advCap", out var advCapSetting);
                    settingsDict.TryGetValue("balanceCap", out var balanceSetting);

                    decimal oldAdvCap = advCapSetting != null ? decimal.Parse(advCapSetting.Value) : 0;
                    decimal oldBalance = balanceSetting != null ? decimal.Parse(balanceSetting.Value) : 0;

                    // Calculate used amount
                    decimal usedAmount = oldAdvCap - oldBalance;

                    // New balance
                    decimal newBalance = newAdvCap - usedAmount;

                    if (newBalance < 0)
                        newBalance = 0; // safeguard

                    // 🔹 Update advCap
                    if (advCapSetting != null)
                    {
                        advCapSetting.Value = newAdvCap.ToString();
                        advCapSetting.UpdatedAt = DateTime.UtcNow;
                    }
                    else
                    {
                        _db.OrganizationSettings.Add(new OrganizationSetting
                        {
                            Id = Guid.NewGuid(),
                            OrganizationId = orgId,
                            Key = "advCap",
                            Value = newAdvCap.ToString(),
                            UpdatedAt = DateTime.UtcNow
                        });
                    }

                    // 🔹 Update balanceCap
                    if (balanceSetting != null)
                    {
                        balanceSetting.Value = newBalance.ToString();
                        balanceSetting.UpdatedAt = DateTime.UtcNow;
                    }
                    else
                    {
                        _db.OrganizationSettings.Add(new OrganizationSetting
                        {
                            Id = Guid.NewGuid(),
                            OrganizationId = orgId,
                            Key = "balanceCap",
                            Value = newBalance.ToString(),
                            UpdatedAt = DateTime.UtcNow
                        });
                    }
                }
                else
                {
                    // Normal logic for other settings
                    if (item.Id.HasValue)
                    {
                        var existing = existingSettings
                            .FirstOrDefault(s => s.Id == item.Id && s.OrganizationId == orgId);

                        if (existing != null)
                        {
                            existing.Key = item.Key;
                            existing.Value = item.Value;
                            existing.UpdatedAt = DateTime.UtcNow;
                        }
                    }
                    else
                    {
                        _db.OrganizationSettings.Add(new OrganizationSetting
                        {
                            Id = Guid.NewGuid(),
                            OrganizationId = orgId,
                            Key = item.Key,
                            Value = item.Value,
                            UpdatedAt = DateTime.UtcNow
                        });
                    }
                }
            }

            await _db.SaveChangesAsync();
        }
    }
}