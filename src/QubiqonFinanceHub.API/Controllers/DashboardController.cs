using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QubiqonFinanceHub.API.Models.Enums;
using QubiqonFinanceHub.API.Services.Interfaces;

namespace QubiqonFinanceHub.API.Controllers;

[ApiController, Route("api/dashboard"), Authorize]
public class DashboardController(IDashboardService dashboard) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(
        [FromQuery] bool myOnly = false,
        [FromQuery] string? reportCurrency = null,
        [FromQuery] DashboardPeriod period = DashboardPeriod.Total) =>
        Ok(await dashboard.GetStatsAsync(myOnly, reportCurrency, period));
}
