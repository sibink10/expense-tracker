using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QubiqonFinanceHub.API.DTOs;
using QubiqonFinanceHub.API.Services.Interfaces;

namespace QubiqonFinanceHub.API.Controllers;

[ApiController, Route("api/advances"), Authorize]
public class AdvancesController(IAdvanceService svc) : ControllerBase
{
    [HttpPost] public async Task<IActionResult> Create([FromBody] CreateAdvanceRequest dto) => Ok(await svc.CreateAsync(dto));
    [HttpPut("{id:guid}")] public async Task<IActionResult> Update(Guid id, [FromBody] UpdateAdvanceRequest dto) => Ok(await svc.UpdateAsync(id, dto));
    [HttpGet("{id:guid}")] public async Task<IActionResult> GetById(Guid id) { var r = await svc.GetByIdAsync(id); return r != null ? Ok(r) : NotFound(); }
    [HttpGet("my")] public async Task<IActionResult> ListMine([FromQuery] FilterParams f) => Ok(await svc.ListAsync(f, true));
    [HttpGet, Authorize(Roles = "Approver,Finance,Admin")]
    public async Task<IActionResult> ListAll([FromQuery] FilterParams f) => Ok(await svc.ListAsync(f));
    [HttpGet("employee/{empId:guid}/history")] public async Task<IActionResult> History(Guid empId) => Ok(await svc.GetEmployeeHistoryAsync(empId));
    [HttpPost("{id:guid}/approve"), Authorize(Roles = "Approver,Finance,Admin")]
    public async Task<IActionResult> Approve(Guid id, [FromBody] ApproveRequest dto) => Ok(await svc.ApproveAsync(id, dto));
    [HttpPost("{id:guid}/reject"), Authorize(Roles = "Approver,Finance,Admin")]
    public async Task<IActionResult> Reject(Guid id, [FromBody] RejectRequest dto) => Ok(await svc.RejectAsync(id, dto));
    [HttpGet("{id:guid}/disburse/validate"), Authorize(Roles = "Finance,Admin")]
    public async Task<IActionResult> ValidateDisburse(Guid id, [FromQuery] decimal paidAmount) => Ok(await svc.ValidateDisburseAsync(id, paidAmount));
    [HttpPost("{id:guid}/disburse"), Authorize(Roles = "Finance,Admin")]
    public async Task<IActionResult> Disburse(Guid id, [FromBody] ProcessPaymentRequest dto) => Ok(await svc.DisburseAsync(id, dto));
    [HttpPost("{id:guid}/cancel")] public async Task<IActionResult> Cancel(Guid id) => Ok(await svc.CancelAsync(id));
}
