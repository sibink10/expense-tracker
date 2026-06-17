using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QubiqonFinanceHub.API.DTOs;
using QubiqonFinanceHub.API.Services.Interfaces;

namespace QubiqonFinanceHub.API.Controllers;

[ApiController, Route("api/expenses"), Authorize]
public class ExpensesController(IExpenseService svc) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Create([FromForm] CreateExpenseRequest dto)
    {
        var result = await svc.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromForm] UpdateExpenseRequest dto)
    {
        var result = await svc.UpdateAsync(id, dto);
        return Ok(result);
    }
    [HttpPost("{id:guid}/upload-bill")]
    public async Task<IActionResult> UploadBill(Guid id, [FromForm] UploadBillRequest dto)
    {
        var result = await svc.UploadBillAsync(id, dto);
        return Ok(result);
    }

    [HttpGet("{id:guid}/bill")]
    public async Task<IActionResult> GetBillUrl(Guid id)
    {
        var result = await svc.GetBillUrlAsync(id);
        return Ok(new { url = result });
    }
    [HttpGet("{id:guid}/documents/{documentId:guid}")]
    public async Task<IActionResult> GetBillDocumentUrl(Guid id, Guid documentId)
    {
        var result = await svc.GetDocumentUrlAsync(id, documentId);
        return Ok(new { url = result });
    }
    [HttpDelete("{id:guid}/documents/{documentId:guid}")]
    public async Task<IActionResult> RemoveDocument(Guid id, Guid documentId)
    {
        await svc.RemoveDocumentAsync(id, documentId);
        return NoContent();
    }
    [HttpGet("{id:guid}")] public async Task<IActionResult> GetById(Guid id) { var r = await svc.GetByIdAsync(id); return r != null ? Ok(r) : NotFound(); }
    [HttpGet("my")] public async Task<IActionResult> ListMine([FromQuery] FilterParams f) => Ok(await svc.ListAsync(f, true));
    [HttpGet, Authorize(Roles = "Approver,Finance,Admin")]
    public async Task<IActionResult> ListAll([FromQuery] FilterParams f) => Ok(await svc.ListAsync(f));
    [HttpPost("{id:guid}/approve"), Authorize(Roles = "Approver,Finance,Admin")]
    public async Task<IActionResult> Approve(Guid id, [FromBody] ApproveRequest dto) => Ok(await svc.ApproveAsync(id, dto));
    [HttpPost("{id:guid}/reject"), Authorize(Roles = "Approver,Finance,Admin")]
    public async Task<IActionResult> Reject(Guid id, [FromBody] RejectRequest dto) => Ok(await svc.RejectAsync(id, dto));
    [HttpPost("{id:guid}/cancel")] public async Task<IActionResult> Cancel(Guid id) => Ok(await svc.CancelAsync(id));
    [HttpPost("{id:guid}/pay"), Authorize(Roles = "Finance,Admin")]
    public async Task<IActionResult> Pay(Guid id, [FromBody] ProcessPaymentRequest dto) => Ok(await svc.ProcessPaymentAsync(id, dto));
    [HttpPost("{id:guid}/attach")] public async Task<IActionResult> Attach(Guid id, [FromBody] string url) { await svc.AttachBillAsync(id, url); return Ok(); }
}
