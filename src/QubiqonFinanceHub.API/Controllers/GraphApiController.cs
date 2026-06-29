using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QubiqonFinanceHub.API.Services.Interfaces;

namespace QubiqonFinanceHub.API.Controllers;

[ApiController]
[Route("api/graph")]
[Authorize(Roles = "Admin")]
public class GraphApiController(IGraphApiService graphApiService) : ControllerBase
{
    [HttpGet("users")]
    public async Task<IActionResult> GetUsers(CancellationToken cancellationToken)
    {
        if (!graphApiService.IsConfigured())
            return StatusCode(StatusCodes.Status503ServiceUnavailable,
                new { message = "Microsoft Graph client credentials are not configured." });

        var users = await graphApiService.GetUsersAsync(cancellationToken);
        return Ok(users);
    }
}
