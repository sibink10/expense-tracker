using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace QubiqonFinanceHub.API.Controllers;

[ApiController, Route("api/health")]
public class HealthController : ControllerBase
{
    [HttpGet, AllowAnonymous]
    public IActionResult Get() => Ok(new { status = "Healthy", service = "Qubiqon Finance Hub", version = "2.0.0", timestamp = DateTime.UtcNow });
}
