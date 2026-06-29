using System.Text;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using QubiqonFinanceHub.API.Auth.Finance;
using QubiqonFinanceHub.API.Auth.Shared;
using QubiqonFinanceHub.API.Data;
using QubiqonFinanceHub.API.Services;
using QubiqonFinanceHub.API.Services.EntraSync;
using QubiqonFinanceHub.API.Services.Implementations;
using QubiqonFinanceHub.API.Services.Interfaces;
using QubiqonFinanceHub.API.Services.Pdf;
using QubiqonFinanceHub.API.Services.Zoho;

namespace QubiqonFinanceHub.API.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services, IConfiguration config)
    {
        services.AddHttpContextAccessor();
        services.AddHttpClient("GraphClient");
        services.AddHttpClient("ZohoSignClient");
        services.Configure<ZohoOptions>(config.GetSection(ZohoOptions.SectionName));
        services.Configure<EmailOptions>(config.GetSection(EmailOptions.SectionName));
        services.AddScoped<IZohoService, ZohoService>();
        services.AddScoped<ITenantService, TenantService>();
        services.AddScoped<ICodeGeneratorService, CodeGeneratorService>();
        services.AddScoped<IEmailService, EmailService>();
        services.AddScoped<IOrganizationService, OrganizationService>();
        services.AddScoped<IExpenseService, ExpenseService>();
        services.AddScoped<IForecastService, ForecastService>();
        services.AddScoped<IInvoicePdfGenerator, InvoicePdfGenerator>();
        services.AddScoped<IInvoiceService, InvoiceService>();
        services.AddScoped<IAdvanceService, AdvanceService>();
        services.AddScoped<IVendorService, VendorService>();
        services.AddScoped<IVendorBillService, VendorBillService>();
        services.AddScoped<IClientService, ClientService>();
        services.AddScoped<ITaxConfigService, TaxConfigService>();
        services.AddScoped<IOrganizationService, OrganizationService>();
        services.AddScoped<ICurrencyRateService, CurrencyRateService>();
        services.AddScoped<IDashboardService, DashboardService>();
        services.AddScoped<ITenantService, TenantService>();
        services.AddScoped<ICodeGeneratorService, CodeGeneratorService>();
        services.AddScoped<IEmployeeService, EmployeeService>();
        services.AddScoped<ICategoryService, CategoryService>();
        services.AddScoped<IPaymentTermService, PaymentTermService>();
        services.AddScoped<IGstTreatmentService, GstTreatmentService>();
        services.AddScoped<IPlaceOfSupplyService, PlaceOfSupplyService>();
        services.AddScoped<IAccountService, AccountService>();
        services.AddScoped<IOrganizationSettingsService, OrganizationSettingsService>();
        services.AddScoped<IExcelUploadService, ExcelUploadService>();
        services.AddScoped<IGraphApiService, GraphApiService>();
        services.AddSingleton<EntraSyncJobStore>();
        services.AddScoped<IEntraEmployeeSyncService, EntraEmployeeSyncService>();

        services.Configure<GlobalAuthOptions>(config.GetSection(GlobalAuthOptions.SectionName));
        services.Configure<TrustedAppsOptions>(config.GetSection(TrustedAppsOptions.SectionName));
        services.AddScoped<IAuthSessionStore, AuthSessionStore>();
        services.AddScoped<IAzureOAuthTokenClient, AzureOAuthTokenClient>();
        services.AddScoped<IAzureTokenRefreshService, AzureTokenRefreshService>();
        services.AddScoped<IGlobalAuthService, GlobalAuthService>();
        services.AddScoped<IAppJwtService, AppJwtService>();
        services.AddScoped<IFinanceRoleResolver, FinanceRoleResolver>();
        services.AddScoped<IEmployeeProvisioningService, EmployeeProvisioningService>();
        services.AddSingleton<ITrustedAzureAccessTokenValidator, TrustedAzureAccessTokenValidator>();

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
        var jwtSecret = config["GlobalAuth:AppJwtSecret"]
            ?? throw new InvalidOperationException("GlobalAuth:AppJwtSecret is required.");

        var oauthRedirectUri = config["GlobalAuth:OAuthRedirectUri"]?.Trim();
        if (string.IsNullOrEmpty(oauthRedirectUri))
            throw new InvalidOperationException("GlobalAuth:OAuthRedirectUri is required.");
        if (!Uri.TryCreate(oauthRedirectUri, UriKind.Absolute, out _))
            throw new InvalidOperationException("GlobalAuth:OAuthRedirectUri must be an absolute URL.");

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = "qubiqon-finance",
                    ValidateAudience = true,
                    ValidAudience = "qubiqon-finance-api",
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
                    RoleClaimType = "role",
                    ClockSkew = TimeSpan.FromMinutes(2)
                };
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
