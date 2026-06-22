using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Identity.Web;
using QubiqonFinanceHub.Mcp.Services;
using QubiqonFinanceHub.Mcp.Tools;

var builder = WebApplication.CreateBuilder(args);

// ─── Inbound auth: validate the Entra ID access token the chatbot sends ───
// The chatbot must acquire a token for THIS server's app registration
// (scope api://{McpClientId}/access_as_user) and send it as Bearer.
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddMicrosoftIdentityWebApi(builder.Configuration.GetSection("AzureAd"));

builder.Services.AddAuthorization();
builder.Services.AddHttpContextAccessor();
builder.Services.AddMemoryCache();

// ─── Typed client that exchanges the inbound Entra token for a Finance
//     app JWT (POST /api/auth/exchange) and forwards read calls ───
builder.Services.AddHttpClient<FinanceApiClient>(c =>
{
    var baseUrl = builder.Configuration["FinanceApi:BaseUrl"]
        ?? throw new InvalidOperationException("FinanceApi:BaseUrl is required (e.g. https://localhost:7201/api).");
    c.BaseAddress = new Uri(baseUrl.TrimEnd('/') + "/");
});

// ─── MCP server over Streamable HTTP, tools discovered by attribute ───
builder.Services
    .AddMcpServer()
    .WithHttpTransport()
    .WithToolsFromAssembly();

var app = builder.Build();

app.UseAuthentication();
app.UseAuthorization();

// The MCP endpoint requires a valid, authenticated user.
app.MapMcp().RequireAuthorization();

app.Run();
