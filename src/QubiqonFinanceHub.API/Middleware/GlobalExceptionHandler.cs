using System.Net;
using System.Text.Json;

namespace QubiqonFinanceHub.API.Middleware;

public class GlobalExceptionHandlerMiddleware(RequestDelegate next, ILogger<GlobalExceptionHandlerMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext ctx)
    {
        try { await next(ctx); }
        catch (Exception ex) { await HandleAsync(ctx, ex); }
    }

    private async Task HandleAsync(HttpContext ctx, Exception ex)
    {
        var (code, msg) = ex switch
        {
            KeyNotFoundException => (HttpStatusCode.NotFound, ex.Message),
            UnauthorizedAccessException => (HttpStatusCode.Forbidden, ex.Message),
            InvalidOperationException => (HttpStatusCode.BadRequest, ex.Message),
            ArgumentException => (HttpStatusCode.BadRequest, ex.Message),
            _ => (HttpStatusCode.InternalServerError, "An unexpected error occurred.")
        };

        if (code == HttpStatusCode.InternalServerError) logger.LogError(ex, "Unhandled: {Msg}", ex.Message);
        else logger.LogWarning("Handled ({Code}): {Msg}", code, ex.Message);

        ctx.Response.StatusCode = (int)code;
        ctx.Response.ContentType = "application/json";
        await ctx.Response.WriteAsync(JsonSerializer.Serialize(new { error = new { code = code.ToString(), message = msg, traceId = ctx.TraceIdentifier } }, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }));
    }
}
