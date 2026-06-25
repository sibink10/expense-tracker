using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QubiqonFinanceHub.API.DTOs;
using QubiqonFinanceHub.API.Services.Interfaces;

namespace QubiqonFinanceHub.API.Controllers;

[ApiController, Route("api/gst-treatments"), Authorize]
public class GstTreatmentsController(IGstTreatmentService svc) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] FilterParams f) => Ok(await svc.ListAsync(f));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var r = await svc.GetByIdAsync(id);
        return r != null ? Ok(r) : NotFound();
    }

    [HttpPost, Authorize(Roles = "Finance,Admin")]
    public async Task<IActionResult> Create([FromBody] CreateGstTreatmentRequest dto) => Ok(await svc.CreateAsync(dto));

    [HttpPut("{id:guid}"), Authorize(Roles = "Finance,Admin")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateGstTreatmentRequest dto) => Ok(await svc.UpdateAsync(id, dto));

    [HttpPost("{id:guid}/toggle"), Authorize(Roles = "Finance,Admin")]
    public async Task<IActionResult> Toggle(Guid id) => Ok(await svc.ToggleActiveAsync(id));
}
