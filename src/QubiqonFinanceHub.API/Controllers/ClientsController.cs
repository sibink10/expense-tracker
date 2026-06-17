using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QubiqonFinanceHub.API.DTOs;
using QubiqonFinanceHub.API.Services.Interfaces;

namespace QubiqonFinanceHub.API.Controllers;

[ApiController, Route("api/clients"), Authorize]
public class ClientsController(IClientService svc) : ControllerBase
{
    [HttpPost] public async Task<IActionResult> Create([FromBody] CreateClientRequest dto) => Ok(await svc.CreateAsync(dto));
    [HttpPut("{id:guid}")] public async Task<IActionResult> Update(Guid id, [FromBody] UpdateClientRequest dto) => Ok(await svc.UpdateAsync(id, dto));
    [HttpGet("form-options")] public async Task<IActionResult> FormOptions() => Ok(await svc.GetFormOptionsAsync());
    [HttpGet("{id:guid}")] public async Task<IActionResult> GetById(Guid id) { var r = await svc.GetByIdAsync(id); return r != null ? Ok(r) : NotFound(); }
    [HttpGet] public async Task<IActionResult> List([FromQuery] FilterParams f) => Ok(await svc.ListAsync(f));
    [HttpDelete("{id:guid}")] public async Task<IActionResult> Delete(Guid id) { await svc.DeleteAsync(id); return NoContent(); }
}
