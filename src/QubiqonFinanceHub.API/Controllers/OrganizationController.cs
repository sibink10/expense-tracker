using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QubiqonFinanceHub.API.DTOs;
using QubiqonFinanceHub.API.Services.Interfaces;

namespace QubiqonFinanceHub.API.Controllers;

[ApiController, Route("api/organization"), Authorize(Roles = "Admin")]
public class OrganizationController(IOrganizationService svc) : ControllerBase
{

    [HttpPost] public async Task<IActionResult> Create([FromForm] CreateOrganizationRequest dto) => Ok(await svc.CreateAsync(dto));
    [HttpGet("all")] public async Task<IActionResult> List() => Ok(await svc.GetAllAsync());
    [HttpGet] public async Task<IActionResult> Get() => Ok(await svc.GetAsync());
    [HttpPut("{id:guid}")] public async Task<IActionResult> Update(Guid id, [FromForm] UpdateOrganizationRequest dto) => Ok(await svc.UpdateAsync(id, dto));
    [HttpGet("settings")] public async Task<IActionResult> Settings() => Ok(await svc.GetSettingsAsync());
    //[HttpPost("settings/{key}")] public async Task<IActionResult> SetSetting(string key, [FromBody] string value) { await svc.SetSettingAsync(key, value); return Ok(); }
    [HttpGet("{id:guid}")] public async Task<IActionResult> GetById(Guid id) => Ok(await svc.GetByIdAsync(id));
    [HttpPatch("{id:guid}/select")] public async Task<IActionResult> Select(Guid id) => Ok(await svc.SelectAsync(id));
}
