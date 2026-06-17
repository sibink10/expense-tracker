using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QubiqonFinanceHub.API.DTOs;
using QubiqonFinanceHub.API.Services.Interfaces;

namespace QubiqonFinanceHub.API.Controllers;

[ApiController, Route("api/payment-terms"), Authorize]
public class PaymentTermsController(IPaymentTermService svc) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] FilterParams f) => Ok(await svc.ListAsync(f));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var r = await svc.GetByIdAsync(id);
        return r != null ? Ok(r) : NotFound();
    }

    [HttpPost, Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] CreatePaymentTermRequest dto) => Ok(await svc.CreateAsync(dto));

    [HttpPut("{id:guid}"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdatePaymentTermRequest dto) => Ok(await svc.UpdateAsync(id, dto));

    [HttpDelete("{id:guid}"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await svc.DeleteAsync(id);
        return NoContent();
    }

    [HttpPost("{id:guid}/toggle"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> Toggle(Guid id) => Ok(await svc.ToggleActiveAsync(id));
}
