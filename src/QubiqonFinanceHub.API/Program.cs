using Microsoft.EntityFrameworkCore;
using QubiqonFinanceHub.API.Data;
using QubiqonFinanceHub.API.Extensions;
using QubiqonFinanceHub.API.Middleware;
using QubiqonFinanceHub.API.Services.Implementations;
using QubiqonFinanceHub.API.Services.Interfaces;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

System.Text.Encoding.RegisterProvider(System.Text.CodePagesEncodingProvider.Instance);

Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .CreateLogger();

builder.Host.UseSerilog();

builder.Services.AddApplicationDatabase(builder.Configuration);
Microsoft.IdentityModel.JsonWebTokens.JsonWebTokenHandler.DefaultInboundClaimTypeMap.Clear();
builder.Services.AddApplicationAuth(builder.Configuration);
builder.Services.AddApplicationServices();
builder.Services.AddApplicationCors(builder.Configuration);
builder.Services.AddSingleton<IStorageService, AzureBlobStorageService>();
builder.Services.AddHttpContextAccessor();

builder.Services.AddControllers()
    .AddJsonOptions(o =>
    {
        o.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
        o.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v2", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "Qubiqon Finance Hub API",
        Version = "v2",
        Description = "Multi-tenant Finance Hub — Expenses, Vendor Payments, Client Invoicing, Advances",
    });
});

builder.Services.AddApplicationInsightsTelemetry();
builder.Services.AddHealthChecks()
    .AddSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")!, name: "azure-sql");

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<FinanceHubDbContext>();
    await db.Database.MigrateAsync();
}

app.UseMiddleware<GlobalExceptionHandlerMiddleware>();

//if (app.Environment.IsDevelopment())
//{
//    app.UseSwagger();
//    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v2/swagger.json", "Qubiqon Finance Hub v2"));
//}
app.UseSwagger();
app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v2/swagger.json", "Qubiqon Finance Hub v2"));

app.UseHttpsRedirection();
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.UseSerilogRequestLogging();
app.MapControllers();
app.MapHealthChecks("/health");
app.Run();
