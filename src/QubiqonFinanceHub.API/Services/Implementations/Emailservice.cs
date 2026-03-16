using Microsoft.Identity.Client;
using Microsoft.EntityFrameworkCore;
using QubiqonFinanceHub.API.Data;
using QubiqonFinanceHub.API.Services.Interfaces;
using System.Net.Http.Headers;

namespace QubiqonFinanceHub.API.Services.Implementations;

public class EmailService : IEmailService
{
    private readonly FinanceHubDbContext _db;
    private readonly IHttpContextAccessor _httpContext;
    private readonly ITenantService _tenant;
    private readonly ILogger<EmailService> _log;
    private readonly IConfiguration _config;
    private readonly HttpClient _httpClient;

    public EmailService(
        FinanceHubDbContext db,
        IHttpContextAccessor httpContext,
        ITenantService tenant,
        ILogger<EmailService> log,
        IConfiguration config,
        IHttpClientFactory httpClientFactory)
    {
        _db = db;
        _httpContext = httpContext;
        _tenant = tenant;
        _log = log;
        _config = config;
        _httpClient = httpClientFactory.CreateClient("GraphClient");
    }

    public async Task SendNotificationAsync(
        string templateKey,
        Dictionary<string, string> variables,
        string toEmail,
        string? ccEmails = null,
        string? attachmentPath = null)
    {
        try
        {
            // 1. Load template from DB
            var orgId = await _tenant.GetCurrentOrganizationId();
            var template = await _db.EmailTemplates
                .FirstOrDefaultAsync(t =>
                    t.TemplateKey == templateKey &&
                    t.OrganizationId == orgId &&
                    t.IsActive)
                ?? throw new KeyNotFoundException(
                    $"Email template '{templateKey}' not found for org {orgId}");

            // 2. Replace {{placeholders}} with actual values
            var subject = ReplacePlaceholders(template.Subject, variables);
            var htmlBody = ReplacePlaceholders(template.HtmlBody, variables);

            // 3. Get user's incoming bearer token
            var userToken = _httpContext.HttpContext!.Request.Headers["Authorization"]
                .ToString().Replace("Bearer ", "").Trim();

            if (string.IsNullOrEmpty(userToken))
                throw new InvalidOperationException("No bearer token found in request.");

            // 4. OBO exchange — get Graph token on behalf of user
            var graphToken = await GetGraphTokenOnBehalfOfAsync(userToken);

            // 5. Send via Graph API
            await SendViaGraphAsync(toEmail, ccEmails, subject, htmlBody, attachmentPath, graphToken);

            _log.LogInformation("Email sent | Template: {Key} | To: {To}", templateKey, toEmail);
        }
        catch (Exception ex)
        {
            _log.LogError(ex, "EmailService error | Template: {Key} | To: {To}", templateKey, toEmail);
            throw;
        }
    }

    // Mirrors Python's get_graph_token_on_behalf_of()
    private async Task<string> GetGraphTokenOnBehalfOfAsync(string userToken)
    {
        var tenantId = _config["ServerApp:TenantId"]!;
        var clientId = _config["ServerApp:ClientId"]!;      
        var clientSecret = _config["ServerApp:ClientSecret"]!;  

        var app = ConfidentialClientApplicationBuilder
            .Create(clientId)
            .WithClientSecret(clientSecret)
            .WithAuthority($"https://login.microsoftonline.com/{tenantId}")
            .Build();

        var result = await app
            .AcquireTokenOnBehalfOf(
                new[] { "https://graph.microsoft.com/Mail.Send" },
                new UserAssertion(userToken))
            .ExecuteAsync();

        return result.AccessToken;
    }

    private async Task SendViaGraphAsync(
        string to, string? cc,
        string subject, string htmlBody,
        string? attachmentPath, string graphToken)
    {
        var toRecipients = new[]
        {
            new { emailAddress = new { address = to } }
        };

        var ccRecipients = cc?
            .Split(',', StringSplitOptions.RemoveEmptyEntries)
            .Select(e => new { emailAddress = new { address = e.Trim() } })
            .ToArray() ?? Array.Empty<object>();

        var attachments = Array.Empty<Dictionary<string, object>>();
        if (attachmentPath != null && File.Exists(attachmentPath))
        {
            var bytes = File.ReadAllBytes(attachmentPath);
            attachments = new[]
            {
                new Dictionary<string, object>
                {
                    ["@odata.type"]  = "#microsoft.graph.fileAttachment",
                    ["name"]         = Path.GetFileName(attachmentPath),
                    ["contentBytes"] = Convert.ToBase64String(bytes)
                }
            };
        }

        var payload = new
        {
            message = new
            {
                subject,
                body = new { contentType = "HTML", content = htmlBody },
                toRecipients,
                ccRecipients,
                attachments
            },
            saveToSentItems = false
        };

        _httpClient.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", graphToken);

        var response = await _httpClient.PostAsJsonAsync(
            "https://graph.microsoft.com/v1.0/me/sendMail", payload);

        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            _log.LogError("Graph sendMail failed: {Error}", error);
            throw new Exception($"Graph sendMail failed: {error}");
        }
    }

    private string ReplacePlaceholders(string template, Dictionary<string, string> variables)
    {
        foreach (var (key, value) in variables)
            template = template.Replace($"{{{{{key}}}}}", value);
        return template;
    }
}