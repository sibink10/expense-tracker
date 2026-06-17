using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QubiqonFinanceHub.API.DTOs;
using QubiqonFinanceHub.API.Services.Interfaces;

namespace QubiqonFinanceHub.API.Controllers;

[ApiController, Route("api/settings/organization"), Authorize]
public class OrganizationSettingsController(IOrganizationSettingsService svc) : ControllerBase
{
    [HttpGet] public async Task<IActionResult> GetSettings() => Ok(await svc.GetSettingsAsync());
    [HttpPost("{key}")] public async Task<IActionResult> SetSetting(string key, [FromBody] string value) { await svc.SetSettingAsync(key, value); return Ok(); }
    [HttpPost("bulk")]public async Task<IActionResult> BulkSetSettings([FromBody] List<BulkSettingItemDto> settings) { await svc.BulkSetSettingsAsync(settings); return Ok(); }
}
