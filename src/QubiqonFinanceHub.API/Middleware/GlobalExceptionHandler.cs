using System.Net;
using System.Text.Json;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

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
        var (code, msg) = MapException(ex);

        if (code == HttpStatusCode.InternalServerError) logger.LogError(ex, "Unhandled: {Msg}", ex.Message);
        else logger.LogWarning("Handled ({Code}): {Msg}", code, msg);

        ctx.Response.StatusCode = (int)code;
        ctx.Response.ContentType = "application/json";
        await ctx.Response.WriteAsync(JsonSerializer.Serialize(new { error = new { code = code.ToString(), message = msg, traceId = ctx.TraceIdentifier } }, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }));
    }

    private static (HttpStatusCode code, string message) MapException(Exception ex)
    {
        return ex switch
        {
            KeyNotFoundException e => (HttpStatusCode.NotFound, e.Message),
            UnauthorizedAccessException e => (HttpStatusCode.Forbidden, e.Message),
            InvalidOperationException e => (HttpStatusCode.BadRequest, e.Message),
            ArgumentException e => (HttpStatusCode.BadRequest, e.Message),
            DbUpdateException e => MapDbUpdateException(e),
            _ => (HttpStatusCode.InternalServerError, "An unexpected error occurred.")
        };
    }

    /// <summary>Maps EF/database failures to HTTP status and a client-safe message (e.g. FK 547).</summary>
    private static (HttpStatusCode code, string message) MapDbUpdateException(DbUpdateException ex)
    {
        for (var e = ex.InnerException; e != null; e = e.InnerException)
        {
            if (e is SqlException sql)
            {
                var msg = sql.Number switch
                {
                    547 => "This record cannot be removed because other records still depend on it.",
                    2627 => "A record with this value already exists.",
                    2601 => "A duplicate value was entered.",
                    515 => "Cannot save: a required value is missing.",
                    _ => sql.Message
                };
                var code = sql.Number == 547 ? HttpStatusCode.Conflict : HttpStatusCode.BadRequest;
                return (code, msg);
            }
        }

        return (HttpStatusCode.BadRequest, string.IsNullOrWhiteSpace(ex.Message) ? "Could not save changes." : ex.Message);
    }
}
