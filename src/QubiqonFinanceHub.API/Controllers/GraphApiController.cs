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
        var users = await graphApiService.GetUsersAsync(cancellationToken);
        return Ok(users);
    }
}
