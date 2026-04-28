using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Web;
using QubiqonFinanceHub.API.Data;
using QubiqonFinanceHub.API.Services.Implementations;
using QubiqonFinanceHub.API.Services.Interfaces;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace QubiqonFinanceHub.API.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddHttpContextAccessor();
        services.AddHttpClient("GraphClient");
        services.AddScoped<ITenantService, TenantService>();
        services.AddScoped<ICodeGeneratorService, CodeGeneratorService>();
        services.AddScoped<IEmailService, EmailService>();
        services.AddScoped<IOrganizationService, OrganizationService>();
        services.AddScoped<IExpenseService, ExpenseService>();
        services.AddScoped<IInvoiceService, InvoiceService>();
        services.AddScoped<IAdvanceService, AdvanceService>();
        services.AddScoped<IVendorService, VendorService>();
        services.AddScoped<IVendorBillService, VendorBillService>();
        services.AddScoped<IClientService, ClientService>();
        services.AddScoped<ITaxConfigService, TaxConfigService>();
        services.AddScoped<IOrganizationService, OrganizationService>();
        services.AddScoped<IDashboardService, DashboardService>();
        services.AddScoped<ITenantService, TenantService>();
        services.AddScoped<ICodeGeneratorService, CodeGeneratorService>();
        services.AddScoped<IEmployeeService, EmployeeService>();
        services.AddScoped<ICategoryService, CategoryService>();
        services.AddScoped<IPaymentTermService, PaymentTermService>();
        services.AddScoped<IAccountService, AccountService>();
        services.AddScoped<IOrganizationSettingsService, OrganizationSettingsService>();
        services.AddScoped<IExcelUploadService, ExcelUploadService>();

        services.AddFluentValidationAutoValidation();
        return services;
    }

    public static IServiceCollection AddApplicationDatabase(this IServiceCollection services, IConfiguration config)
    {
        services.AddDbContext<FinanceHubDbContext>(o =>
            o.UseSqlServer(config.GetConnectionString("DefaultConnection"),
                sql => { sql.EnableRetryOnFailure(5, TimeSpan.FromSeconds(30), null); sql.CommandTimeout(30); }));
        return services;
    }

    public static IServiceCollection AddApplicationAuth(this IServiceCollection services, IConfiguration config)
    {
        services.AddMicrosoftIdentityWebApiAuthentication(config, "AzureAd")
            .EnableTokenAcquisitionToCallDownstreamApi()
            .AddInMemoryTokenCaches();

        // Tell .NET to read roles from "roles" claim
        services.Configure<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme, options =>
        {
            options.TokenValidationParameters.RoleClaimType = "roles";
        });

        services.AddAuthorizationBuilder()
            .AddPolicy("EmployeeOnly", p => p.RequireRole("Employee", "Approver", "Finance", "Admin"))
            .AddPolicy("ApproverOnly", p => p.RequireRole("Approver", "Admin"))
            .AddPolicy("FinanceOnly", p => p.RequireRole("Finance", "Admin"))
            .AddPolicy("AdminOnly", p => p.RequireRole("Admin"));

        return services;
    }

    public static IServiceCollection AddApplicationCors(this IServiceCollection services, IConfiguration config)
    {
        services.AddCors(o => o.AddPolicy("AllowFrontend", b =>
        {
            var origins = config.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? ["https://localhost:3000"];
            b.WithOrigins(origins).AllowAnyMethod().AllowAnyHeader().AllowCredentials();
        }));
        return services;
    }
}
