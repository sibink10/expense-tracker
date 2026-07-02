using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QubiqonFinanceHub.API.DTOs;
using QubiqonFinanceHub.API.Services.EntraSync;
using QubiqonFinanceHub.API.Services.Interfaces;

namespace QubiqonFinanceHub.API.Controllers;

[ApiController, Route("api/employees"), Authorize]
public class EmployeesController(
    IEmployeeService svc,
    IEntraEmployeeSyncService entraSync,
    IGraphApiService graphApi,
    ITenantService tenant) : ControllerBase
{
    [HttpGet, Authorize(Roles = "Finance,Admin")]
    public async Task<IActionResult> List([FromQuery] FilterParams f) => Ok(await svc.ListAsync(f));

    [HttpGet("roles"), Authorize(Roles = "Finance,Admin")]
    public async Task<IActionResult> ListRoles() => Ok(await svc.ListRolesAsync());

    [HttpPost("sync-from-entra"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> SyncFromEntra(CancellationToken cancellationToken)
    {
        if (!graphApi.IsConfigured())
            return StatusCode(StatusCodes.Status503ServiceUnavailable,
                new { message = "Microsoft Graph client credentials are not configured." });

        var orgId = await tenant.GetHomeOrganizationIdAsync();
        var result = await entraSync.StartSyncAsync(orgId, cancellationToken);
        return Accepted(result);
    }

    [HttpGet("sync-from-entra/jobs/{jobId:guid}"), Authorize(Roles = "Admin")]
    public IActionResult GetSyncFromEntraJob(Guid jobId)
    {
        var job = entraSync.GetJob(jobId);
        return job != null ? Ok(job) : NotFound();
    }

    [HttpGet("{id:guid}"), Authorize(Roles = "Finance,Admin")]
    public async Task<IActionResult> GetById(Guid id) { var r = await svc.GetByIdAsync(id); return r != null ? Ok(r) : NotFound(); }

    [HttpPost, Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] CreateEmployeeRequest dto) => Ok(await svc.CreateAsync(dto));

    [HttpPut("{id:guid}"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateEmployeeRequest dto) => Ok(await svc.UpdateAsync(id, dto));

    [HttpPost("{id:guid}/toggle"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> Toggle(Guid id) => Ok(await svc.ToggleActiveAsync(id));

    [HttpPatch("{id:guid}/delete"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id) => Ok(await svc.DeleteAsync(id));
}
