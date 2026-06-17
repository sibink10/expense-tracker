using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QubiqonFinanceHub.API.DTOs;
using QubiqonFinanceHub.API.Services.Interfaces;

namespace QubiqonFinanceHub.API.Controllers;

[ApiController, Route("api/bills"), Authorize]
public class BillsController(IVendorBillService svc) : ControllerBase
{
    //[HttpPost, Authorize(Roles = "Finance,Admin")]
    [HttpPost]
    public async Task<IActionResult> Create([FromForm] CreateBillRequest dto)
    {
        var result = await svc.CreateAsync(dto);
        return Ok(result);
    }
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateBillRequest dto)
    {
        var result = await svc.UpdateAsync(id, dto);
        return Ok(result);
    }
    [HttpPost("{id:guid}/upload-bill")]
    public async Task<IActionResult> UploadBill(Guid id, [FromForm] UploadVendorBillRequest dto)
    {
        var result = await svc.UploadBillAsync(id, dto);
        return Ok(result);
    }
    [HttpGet("{id:guid}")] public async Task<IActionResult> GetById(Guid id) { var r = await svc.GetByIdAsync(id); return r != null ? Ok(r) : NotFound(); }
    [HttpGet, Authorize(Roles = "Approver,Finance,Admin")]
    public async Task<IActionResult> List([FromQuery] FilterParams f) => Ok(await svc.ListAsync(f));
    [HttpPost("{id:guid}/approve"), Authorize(Roles = "Approver,Finance,Admin")]
    public async Task<IActionResult> Approve(Guid id, [FromBody] ApproveRequest dto) => Ok(await svc.ApproveAsync(id, dto));
    [HttpPost("{id:guid}/reject"), Authorize(Roles = "Approver,Finance,Admin")]
    public async Task<IActionResult> Reject(Guid id, [FromBody] RejectRequest dto) => Ok(await svc.RejectAsync(id, dto));
    [HttpPost("{id:guid}/pay"), Authorize(Roles = "Finance,Admin")]
    public async Task<IActionResult> Pay(Guid id, [FromBody] ProcessPaymentRequest dto) => Ok(await svc.ProcessPaymentAsync(id, dto));
    [HttpGet("{id:guid}/attachment")]
    public async Task<IActionResult> GetAttachmentUrl(Guid id)
    {
        var result = await svc.GetAttachmentUrlAsync(id);
        return Ok(new { url = result });
    }
    [HttpGet("{id:guid}/documents/{documentId:guid}")]
    public async Task<IActionResult> GetDocumentUrl(Guid id, Guid documentId)
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
}
