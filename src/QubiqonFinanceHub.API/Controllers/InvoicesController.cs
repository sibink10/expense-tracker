using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QubiqonFinanceHub.API.DTOs;
using QubiqonFinanceHub.API.Services.Interfaces;

namespace QubiqonFinanceHub.API.Controllers;

//[ApiController, Route("api/invoices"), Authorize(Roles = "Finance,Admin")]
[ApiController, Route("api/invoices"), Authorize]
public class InvoicesController(IInvoiceService svc) : ControllerBase
{
    [HttpPost] public async Task<IActionResult> Create([FromBody] CreateInvoiceRequest dto) => Ok(await svc.CreateAsync(dto));
    [HttpPut("{id:guid}")] public async Task<IActionResult> Update(Guid id, [FromBody] UpdateInvoiceRequest dto) => Ok(await svc.UpdateAsync(id, dto));
    [HttpGet("{id:guid}")] public async Task<IActionResult> GetById(Guid id) { var r = await svc.GetByIdAsync(id); return r != null ? Ok(r) : NotFound(); }
    [HttpGet, Authorize(Roles = "Approver,Finance,Admin")]
    public async Task<IActionResult> List([FromQuery] FilterParams f) => Ok(await svc.ListAsync(f));
    [HttpGet("counts"), Authorize(Roles = "Approver,Finance,Admin")]
    public async Task<IActionResult> Counts() => Ok(await svc.GetStatusCountsAsync());
    [HttpPost("{id:guid}/send"), Authorize(Roles = "Finance,Admin")]
    public async Task<IActionResult> Send(Guid id) => Ok(await svc.MarkSentAsync(id));
    [HttpPost("{id:guid}/paid"), Authorize(Roles = "Finance,Admin")]
    public async Task<IActionResult> Paid(Guid id, [FromBody] ProcessPaymentRequest dto) => Ok(await svc.MarkPaidAsync(id, dto));
    [HttpGet("{id:guid}/pdf")] public async Task<IActionResult> Pdf(Guid id) { var pdf = await svc.GeneratePdfAsync(id); return File(pdf, "application/pdf", $"invoice-{id}.pdf"); }

    [HttpGet("{id:guid}/signed-pdf")]
    public async Task<IActionResult> GetSignedPdfUrl(Guid id)
    {
        try
        {
            var url = await svc.GetSignedPdfUrlAsync(id);
            return Ok(new { url });
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("{id:guid}/zoho-sign/status")]
    public async Task<IActionResult> ZohoSignStatus(Guid id, [FromQuery] bool refresh = true)
    {
        try
        {
            return Ok(await svc.GetZohoSignStatusAsync(id, refresh));
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPost("{id:guid}/zoho-sign/sync"), Authorize(Roles = "Finance,Admin")]
    public async Task<IActionResult> ZohoSignSync(Guid id)
    {
        try
        {
            return Ok(await svc.SyncSignedPdfFromZohoAsync(id));
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
