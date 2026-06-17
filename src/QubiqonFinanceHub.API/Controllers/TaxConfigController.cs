using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QubiqonFinanceHub.API.DTOs;
using QubiqonFinanceHub.API.Services.Interfaces;

namespace QubiqonFinanceHub.API.Controllers;

[ApiController, Route("api/tax-config"), Authorize(Roles = "Admin")]
public class TaxConfigController(ITaxConfigService svc) : ControllerBase
{
    [HttpPost] public async Task<IActionResult> Create([FromBody] CreateTaxConfigRequest dto) => Ok(await svc.CreateAsync(dto));
    [HttpGet] public async Task<IActionResult> List([FromQuery] string? type) => Ok(await svc.ListAsync(type));
    [HttpGet("{id:guid}")] public async Task<IActionResult> GetById(Guid id) { var r = await svc.GetByIdAsync(id); return r == null ? NotFound() : Ok(r); }
    [HttpPut("{id:guid}")] public async Task<IActionResult> Update(Guid id, [FromBody] UpdateTaxConfigRequest dto) => Ok(await svc.UpdateAsync(id, dto));
    [HttpPost("{id:guid}/toggle")] public async Task<IActionResult> Toggle(Guid id) => Ok(await svc.ToggleActiveAsync(id));
}
