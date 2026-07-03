using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using QubiqonFinanceHub.API.Services;

namespace QubiqonFinanceHub.API.Controllers;

[ApiController, Route("api/config")]
public class ConfigController(IOptions<EmailOptions> emailOptions) : ControllerBase
{
    [HttpGet("email"), AllowAnonymous]
    public IActionResult GetEmail() => Ok(emailOptions.Value);
}
