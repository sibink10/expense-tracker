using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QubiqonFinanceHub.API.DTOs;
using QubiqonFinanceHub.API.Services.Interfaces;

namespace QubiqonFinanceHub.API.Controllers;

[ApiController, Route("api/place-of-supply"), Authorize]
public class PlaceOfSupplyController(IPlaceOfSupplyService svc) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] FilterParams f) => Ok(await svc.ListAsync(f));

    [HttpGet("{code}")]
    public async Task<IActionResult> GetByCode(string code)
    {
        var r = await svc.GetByCodeAsync(code);
        return r != null ? Ok(r) : NotFound();
    }

    [HttpPost, Authorize(Roles = "Finance,Admin")]
    public async Task<IActionResult> Create([FromBody] CreatePlaceOfSupplyRequest dto) => Ok(await svc.CreateAsync(dto));

    [HttpPut("{code}"), Authorize(Roles = "Finance,Admin")]
    public async Task<IActionResult> Update(string code, [FromBody] UpdatePlaceOfSupplyRequest dto) => Ok(await svc.UpdateAsync(code, dto));

    [HttpDelete("{code}"), Authorize(Roles = "Finance,Admin")]
    public async Task<IActionResult> Delete(string code)
    {
        await svc.DeleteAsync(code);
        return NoContent();
    }
}
