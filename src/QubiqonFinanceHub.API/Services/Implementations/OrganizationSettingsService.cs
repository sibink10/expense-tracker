using System.Globalization;
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
            var now = DateTime.UtcNow;

            // Load all existing settings once (IMPORTANT: avoid N queries)
            var existingSettings = await _db.OrganizationSettings
                .Where(s => s.OrganizationId == orgId)
                .ToListAsync();

            var settingsDict = existingSettings.ToDictionary(s => s.Key, s => s);

            OrganizationSetting UpsertSetting(string key, string value, Guid? id = null)
            {
                if (settingsDict.TryGetValue(key, out var existingByKey))
                {
                    existingByKey.Value = value;
                    existingByKey.UpdatedAt = now;
                    return existingByKey;
                }

                var existingById = id.HasValue
                    ? existingSettings.FirstOrDefault(s => s.Id == id && s.OrganizationId == orgId)
                    : null;

                if (existingById != null)
                {
                    settingsDict.Remove(existingById.Key);
                    existingById.Key = key;
                    existingById.Value = value;
                    existingById.UpdatedAt = now;
                    settingsDict[key] = existingById;
                    return existingById;
                }

                var setting = new OrganizationSetting
                {
                    Id = Guid.NewGuid(),
                    OrganizationId = orgId,
                    Key = key,
                    Value = value,
                    UpdatedAt = now
                };

                _db.OrganizationSettings.Add(setting);
                existingSettings.Add(setting);
                settingsDict[key] = setting;
                return setting;
            }

            foreach (var item in settings)
            {
                if (item.Key == "advCap")
                {
                    var newAdvCap = decimal.Parse(item.Value, CultureInfo.InvariantCulture);

                    settingsDict.TryGetValue("advCap", out var advCapSetting);
                    settingsDict.TryGetValue("balanceCap", out var balanceSetting);

                    decimal oldAdvCap = advCapSetting != null ? decimal.Parse(advCapSetting.Value, CultureInfo.InvariantCulture) : 0;
                    decimal oldBalance = balanceSetting != null ? decimal.Parse(balanceSetting.Value, CultureInfo.InvariantCulture) : 0;

                    // Calculate used amount
                    decimal usedAmount = oldAdvCap - oldBalance;

                    // New balance
                    decimal newBalance = newAdvCap - usedAmount;

                    if (newBalance < 0)
                        newBalance = 0; // safeguard

                    // 🔹 Update advCap
                    UpsertSetting("advCap", newAdvCap.ToString(CultureInfo.InvariantCulture), item.Id);

                    // 🔹 Update balanceCap
                    UpsertSetting("balanceCap", newBalance.ToString(CultureInfo.InvariantCulture));
                }
                else
                {
                    // Normal logic for other settings
                    UpsertSetting(item.Key, item.Value, item.Id);
                }
            }

            ValidateBalanceCapVsAdvCap(orgId);

            await _db.SaveChangesAsync();
        }

        /// <summary>Ensures balance cap (remaining pool) does not exceed the advance cap (max pool size).</summary>
        private void ValidateBalanceCapVsAdvCap(Guid orgId)
        {
            var orgSettings = _db.OrganizationSettings.Local
                .Where(s => s.OrganizationId == orgId)
                .ToList();
            var adv = orgSettings.FirstOrDefault(s => s.Key == "advCap");
            var bal = orgSettings.FirstOrDefault(s => s.Key == "balanceCap");
            if (bal == null) return;
            if (!decimal.TryParse(bal.Value, NumberStyles.Any, CultureInfo.InvariantCulture, out var b)) return;
            var a = 0m;
            if (adv != null && decimal.TryParse(adv.Value, NumberStyles.Any, CultureInfo.InvariantCulture, out var ap))
                a = ap;
            if (b > a)
                throw new InvalidOperationException("Balance cap cannot exceed the advance cap amount.");
        }
    }
}
