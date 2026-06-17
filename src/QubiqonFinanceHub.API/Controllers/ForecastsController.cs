using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QubiqonFinanceHub.API.DTOs;
using QubiqonFinanceHub.API.Services.Interfaces;

namespace QubiqonFinanceHub.API.Controllers;

[ApiController, Route("api/forecasts"), Authorize]
public class ForecastsController(IForecastService svc) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] FilterParams f) => Ok(await svc.ListAsync(f));

    [HttpGet("approved")]
    public async Task<IActionResult> ListApproved() => Ok(await svc.ListApprovedAsync());

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await svc.GetByIdAsync(id);
        return result != null ? Ok(result) : NotFound();
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromForm] CreateForecastRequest dto)
    {
        var result = await svc.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromForm] UpdateForecastRequest dto) => Ok(await svc.UpdateAsync(id, dto));

    [HttpPost("{id:guid}/submit")]
    public async Task<IActionResult> Submit(Guid id) => Ok(await svc.SubmitAsync(id));

    [HttpGet("my")] public async Task<IActionResult> ListMine([FromQuery] FilterParams f) => Ok(await svc.ListAsync(f, true));

    [HttpPost("{id:guid}/approve"), Authorize(Roles = "Approver,Finance,Admin")]
    public async Task<IActionResult> Approve(Guid id, [FromBody] ApproveRequest dto) => Ok(await svc.ApproveAsync(id, dto));

    [HttpPost("{id:guid}/reject"), Authorize(Roles = "Approver,Finance,Admin")]
    public async Task<IActionResult> Reject(Guid id, [FromBody] RejectRequest dto) => Ok(await svc.RejectAsync(id, dto));

    [HttpPost("{id:guid}/cancel")]
    public async Task<IActionResult> Cancel(Guid id) => Ok(await svc.CancelAsync(id));

    [HttpGet("{id:guid}/documents/{documentId:guid}")]
    public async Task<IActionResult> GetDocumentUrl(Guid id, Guid documentId)
    {
        var result = await svc.GetDocumentUrlAsync(id, documentId);
        return Ok(new { url = result });
    }
}
