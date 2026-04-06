using Microsoft.Identity.Client;
using Microsoft.EntityFrameworkCore;
using QubiqonFinanceHub.API.Data;
using QubiqonFinanceHub.API.Models.Constants;
using QubiqonFinanceHub.API.Models.Entities;
using QubiqonFinanceHub.API.Services.Interfaces;
using System.Net;
using System.Net.Http.Headers;

namespace QubiqonFinanceHub.API.Services.Implementations;

public class EmailService : IEmailService
{
    private readonly FinanceHubDbContext _db;
    private readonly IHttpContextAccessor _httpContext;
    private readonly ITenantService _tenant;
    private readonly IStorageService _storage;
    private readonly ILogger<EmailService> _log;
    private readonly IConfiguration _config;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly HttpClient _httpClient;

    public EmailService(
        FinanceHubDbContext db,
        IHttpContextAccessor httpContext,
        ITenantService tenant,
        IStorageService storage,
        ILogger<EmailService> log,
        IConfiguration config,
        IHttpClientFactory httpClientFactory)
    {
        _db = db;
        _httpContext = httpContext;
        _tenant = tenant;
        _storage = storage;
        _log = log;
        _config = config;
        _httpClientFactory = httpClientFactory;
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
            NormalizeActionDateToIst(variables);
            await InjectViewLinkAsync(variables);
            var template = await ResolveTemplateAsync(templateKey, variables);

            // Payment-related notifications must be sent from a fixed finance mailbox using
            // app-only Graph auth (application permissions), not delegated OBO.
            var isFinanceAppOnlyPaymentNotification =
                templateKey == Constants.EmailTemplateKeys.VendorBillPaid || // includes partial payments
                templateKey == Constants.EmailTemplateKeys.VendorBillRejected ||
                templateKey == Constants.EmailTemplateKeys.PaymentConfirmation || // expense pay
                templateKey == Constants.EmailTemplateKeys.AdvanceDisbursed; // advance pay

            if (isFinanceAppOnlyPaymentNotification)
            {
                var senderEmail = GetFinanceSenderEmail();
                var graphToken = await GetGraphTokenForAppAsync();

                await SendViaGraphAsAppAsync(
                    senderEmail,
                    toEmail,
                    ccEmails,
                    template.Subject,
                    template.HtmlBody,
                    attachmentPath,
                    graphToken,
                    template.InlineAttachments);
            }
            else
            {
                // 3. Get user's incoming bearer token (delegated flow)
                var userToken = _httpContext.HttpContext!.Request.Headers["Authorization"]
                    .ToString().Replace("Bearer ", "").Trim();

                if (string.IsNullOrEmpty(userToken))
                    throw new InvalidOperationException("No bearer token found in request.");

                // 4. OBO exchange — get Graph token on behalf of user
                var graphToken = await GetGraphTokenOnBehalfOfAsync(userToken);

                // 5. Send via Graph API (delegated flow)
                await SendViaGraphAsync(
                    toEmail,
                    ccEmails,
                    template.Subject,
                    template.HtmlBody,
                    attachmentPath,
                    graphToken,
                    template.InlineAttachments);
            }

            _log.LogInformation("Email sent | Template: {Key} | To: {To}", templateKey, toEmail);
        }
        catch (Exception ex)
        {
            _log.LogError(ex, "EmailService error | Template: {Key} | To: {To}", templateKey, toEmail);
            throw;
        }
    }

    private async Task<EmailContent> ResolveTemplateAsync(string templateKey, Dictionary<string, string> variables)
    {
        var builtInTemplate = await TryBuildSystemTemplateAsync(templateKey, variables);
        if (builtInTemplate != null)
            return builtInTemplate;

        var orgId = await _tenant.GetCurrentOrganizationId();
        var template = await _db.EmailTemplates
            .FirstOrDefaultAsync(t =>
                t.TemplateKey == templateKey &&
                t.OrganizationId == orgId &&
                t.IsActive)
            ?? throw new KeyNotFoundException(
                $"Email template '{templateKey}' not found for org {orgId}");

        return new EmailContent(
            ReplacePlaceholders(template.Subject, variables),
            ReplacePlaceholders(template.HtmlBody, variables));
    }

    private async Task<EmailContent?> TryBuildSystemTemplateAsync(string templateKey, Dictionary<string, string> variables)
    {
        var supportedKeys = new[]
        {
            Constants.EmailTemplateKeys.ExpenseSubmitted,
            Constants.EmailTemplateKeys.ExpenseApproved,
            "expense_awaiting_bill",
            Constants.EmailTemplateKeys.ExpenseSubmitterUploadBills,
            Constants.EmailTemplateKeys.ExpenseBillUploadedFinance,
            Constants.EmailTemplateKeys.ExpenseRejected,
            "payment_confirmation",
            Constants.EmailTemplateKeys.AdvanceSubmitted,
            Constants.EmailTemplateKeys.AdvanceApproved,
            Constants.EmailTemplateKeys.AdvanceRejected,
            Constants.EmailTemplateKeys.AdvanceDisbursed,
            Constants.EmailTemplateKeys.VendorBillSubmitted,
            Constants.EmailTemplateKeys.VendorBillApproved,
            Constants.EmailTemplateKeys.VendorBillRejected,
            Constants.EmailTemplateKeys.VendorBillPaid,
            Constants.EmailTemplateKeys.InvoiceCreated,
            Constants.EmailTemplateKeys.InvoiceSent,
            Constants.EmailTemplateKeys.InvoicePaid
        };

        if (!supportedKeys.Contains(templateKey))
            return null;

        var org = await _tenant.GetCurrentOrganizationAsync();
        var logoUrl = string.IsNullOrWhiteSpace(org.LogoUrl)
            ? null
            : _storage.GenerateSasUrl(org.LogoUrl, 60 * 24 * 7);
        var logoContentId = "org-logo@qubiqon";
        var inlineLogo = await TryCreateInlineLogoAttachmentAsync(logoUrl, logoContentId);

        var logoMarkup = BuildLogoMarkup(org, logoUrl, inlineLogo != null, logoContentId);

        return templateKey switch
        {
            var key when key == Constants.EmailTemplateKeys.ExpenseSubmitted => BuildExpenseEmailContent(
                org,
                logoMarkup,
                inlineLogo,
                "Submitted",
                "#0f766e",
                BuildExpenseSubmittedSubject(GetVariable(variables, "expense_id")),
                "Expense Submitted For Review",
                $"A new expense request <strong>{Encode(GetVariable(variables, "expense_id"))}</strong> has been submitted for review.",
                "Please review the request and take the appropriate action.",
                "Submitted By",
                GetVariable(variables, "submitted_by"),
                GetVariableOrEmpty(variables, "submission_notes"),
                "Submission Notes",
                variables,
                includePaymentReference: false),

            var key when key == Constants.EmailTemplateKeys.ExpenseApproved => BuildExpenseEmailContent(
                org,
                logoMarkup,
                inlineLogo,
                "Approved",
                "#22c55e",
                BuildStatusSubject("Approved", "Expense", GetVariable(variables, "expense_id")),
                "Expense Approved",
                $"Your expense request <strong>{Encode(GetVariable(variables, "expense_id"))}</strong> has been approved.",
                "No further action is needed from your side at this stage.",
                "Approved By",
                GetVariable(variables, "approver_name"),
                GetVariableOrEmpty(variables, "approver_comments"),
                "Approver Comments",
                variables,
                includePaymentReference: false),

            "expense_awaiting_bill" => BuildExpenseEmailContent(
                org,
                logoMarkup,
                inlineLogo,
                "Awaiting Bill",
                "#f59e0b",
                BuildStatusSubject("Approved", "Expense", GetVariable(variables, "expense_id")),
                "Expense Approved - Bill Required",
                $"Your expense request <strong>{Encode(GetVariable(variables, "expense_id"))}</strong> has been approved and is now waiting for bill submission.",
                "Please upload the supporting bill to complete the expense process.",
                "Approved By",
                GetVariable(variables, "approver_name"),
                GetVariableOrEmpty(variables, "approver_comments"),
                "Approver Comments",
                variables,
                includePaymentReference: false),

            var key when key == Constants.EmailTemplateKeys.ExpenseSubmitterUploadBills => BuildExpenseEmailContent(
                org,
                logoMarkup,
                inlineLogo,
                "Submit Bills",
                "#f59e0b",
                BuildStatusSubject("Submit bills", "Expense", GetVariable(variables, "expense_id")),
                "Please submit bills for payment",
                $"Your expense request <strong>{Encode(GetVariable(variables, "expense_id"))}</strong> has been approved by <strong>{Encode(GetVariable(variables, "approver_name"))}</strong>. No bills were attached at approval.",
                "Please upload your supporting bill documents in the expense portal so finance can process payment.",
                "Approved By",
                GetVariable(variables, "approver_name"),
                GetVariableOrEmpty(variables, "approver_comments"),
                "Approver Comments",
                variables,
                includePaymentReference: false),

            var key when key == Constants.EmailTemplateKeys.ExpenseBillUploadedFinance => BuildExpenseEmailContent(
                org,
                logoMarkup,
                inlineLogo,
                "Bill received",
                "#22c55e",
                BuildStatusSubject("Bill received", "Expense", GetVariable(variables, "expense_id")),
                "Expense bill received — approved for payment",
                $"Supporting bill documents have been uploaded for expense <strong>{Encode(GetVariable(variables, "expense_id"))}</strong>. The expense request is approved and bills are attached — ready for payment.",
                "Please review the expense in Finance Hub and process payment when ready.",
                "Uploaded By",
                GetVariable(variables, "uploaded_by_name"),
                GetVariableOrEmpty(variables, "upload_notes"),
                "Notes",
                variables,
                includePaymentReference: false),

            var key when key == Constants.EmailTemplateKeys.ExpenseRejected => BuildExpenseEmailContent(
                org,
                logoMarkup,
                inlineLogo,
                "Rejected",
                "#ef4444",
                BuildStatusSubject("Rejected", "Expense", GetVariable(variables, "expense_id")),
                "Expense Rejected",
                $"Your expense request <strong>{Encode(GetVariable(variables, "expense_id"))}</strong> has been rejected.",
                "Please review the reason below and resubmit if required.",
                "Rejected By",
                GetVariable(variables, "rejected_by"),
                GetVariableOrEmpty(variables, "reason"),
                "Rejection Reason",
                variables,
                includePaymentReference: false),

            "payment_confirmation" => BuildExpenseEmailContent(
                org,
                logoMarkup,
                inlineLogo,
                "Paid",
                "#2563eb",
                BuildStatusSubject("Paid", "Expense", GetVariable(variables, "expense_id")),
                "Expense Payment Released",
                $"Payment has been released for your expense request <strong>{Encode(GetVariable(variables, "expense_id"))}</strong>.",
                "Please find the payment reference and processed details below.",
                "Processed By",
                GetVariable(variables, "processed_by"),
                GetVariableOrEmpty(variables, "payment_notes"),
                "Payment Notes",
                variables,
                includePaymentReference: true),

            var key when key == Constants.EmailTemplateKeys.AdvanceSubmitted => BuildAdvanceEmailContent(
                org,
                logoMarkup,
                inlineLogo,
                "Submitted",
                "#0f766e",
                BuildAdvanceSubmittedSubject(GetVariable(variables, "advance_id")),
                "Advance Request Submitted",
                $"A new advance request <strong>{Encode(GetVariable(variables, "advance_id"))}</strong> has been submitted for review.",
                "Please review the request and proceed with approval or rejection.",
                "Submitted By",
                GetVariable(variables, "submitted_by"),
                GetVariableOrEmpty(variables, "submission_notes"),
                "Submission Notes",
                variables,
                includePaymentReference: false),

            var key when key == Constants.EmailTemplateKeys.AdvanceApproved => BuildAdvanceEmailContent(
                org,
                logoMarkup,
                inlineLogo,
                "Approved",
                "#22c55e",
                BuildStatusSubject("Approved", "Advance", GetVariable(variables, "advance_id")),
                "Advance Request Approved",
                $"Your advance request <strong>{Encode(GetVariable(variables, "advance_id"))}</strong> has been approved.",
                "The approved amount is reserved and can now move to disbursement.",
                "Approved By",
                GetVariable(variables, "approver_name"),
                GetVariableOrEmpty(variables, "approver_comments"),
                "Approver Comments",
                variables,
                includePaymentReference: false),

            var key when key == Constants.EmailTemplateKeys.AdvanceRejected => BuildAdvanceEmailContent(
                org,
                logoMarkup,
                inlineLogo,
                "Rejected",
                "#ef4444",
                BuildStatusSubject("Rejected", "Advance", GetVariable(variables, "advance_id")),
                "Advance Request Rejected",
                $"Your advance request <strong>{Encode(GetVariable(variables, "advance_id"))}</strong> has been rejected.",
                "Please review the reason below before submitting a new request.",
                "Rejected By",
                GetVariable(variables, "rejected_by"),
                GetVariableOrEmpty(variables, "reason"),
                "Rejection Reason",
                variables,
                includePaymentReference: false),

            var key when key == Constants.EmailTemplateKeys.AdvanceDisbursed => BuildAdvanceEmailContent(
                org,
                logoMarkup,
                inlineLogo,
                "Disbursed",
                "#2563eb",
                BuildStatusSubject("Disbursed", "Advance", GetVariable(variables, "advance_id")),
                "Advance Disbursed",
                $"Your advance request <strong>{Encode(GetVariable(variables, "advance_id"))}</strong> has been disbursed.",
                "Please find the payment reference and processing details below.",
                "Processed By",
                GetVariable(variables, "processed_by"),
                GetVariableOrEmpty(variables, "payment_notes"),
                "Payment Notes",
                variables,
                includePaymentReference: true),

            var key when key == Constants.EmailTemplateKeys.VendorBillSubmitted => BuildVendorBillEmailContent(
                org,
                logoMarkup,
                inlineLogo,
                "Submitted",
                "#0f766e",
                BuildNewSubject("Vendor Bill", GetVariable(variables, "bill_id")),
                "Vendor Bill Submitted",
                $"A new vendor bill <strong>{Encode(GetVariable(variables, "bill_id"))}</strong> has been submitted for review.",
                "Please review the bill and proceed with approval or rejection.",
                "Submitted By",
                GetVariable(variables, "submitted_by"),
                string.Empty,
                "Notes",
                variables,
                includePaymentReference: false,
                includeBillIdRow: true),

            var key when key == Constants.EmailTemplateKeys.VendorBillApproved => BuildVendorBillEmailContent(
                org,
                logoMarkup,
                inlineLogo,
                "Approved",
                "#22c55e",
                BuildStatusSubject("Approved", "Vendor Bill", GetVariable(variables, "bill_id")),
                "Vendor Bill Approved",
                $"Vendor bill <strong>{Encode(GetVariable(variables, "bill_id"))}</strong> has been approved.",
                "The bill is now ready for payment processing.",
                "Approved By",
                GetVariable(variables, "actor_name"),
                GetVariableOrEmpty(variables, "details_text"),
                "Approver Comments",
                variables,
                includePaymentReference: false,
                includeBillIdRow: true),

            var key when key == Constants.EmailTemplateKeys.VendorBillRejected => BuildVendorBillEmailContent(
                org,
                logoMarkup,
                inlineLogo,
                "Rejected",
                "#ef4444",
                BuildStatusSubject("Rejected", "Vendor Bill", GetVariable(variables, "bill_id")),
                "Vendor Bill Rejected",
                $"Vendor bill <strong>{Encode(GetVariable(variables, "bill_id"))}</strong> has been rejected.",
                "Please review the rejection reason below and update the bill if required.",
                "Rejected By",
                GetVariable(variables, "actor_name"),
                GetVariableOrEmpty(variables, "details_text"),
                "Rejection Reason",
                variables,
                includePaymentReference: false,
                includeBillIdRow: true),

            var key when key == Constants.EmailTemplateKeys.VendorBillPaid => BuildVendorBillEmailContent(
                org,
                logoMarkup,
                inlineLogo,
                "Paid",
                "#2563eb",
                BuildVendorBillPaidSubject(variables),
                "Bill paid",
                $"Hi {Encode(GetVariable(variables, "vendor_name"))},<br/><br/>Payment has been processed for your bill.",
                "Please find the payment reference and processing details below.",
                "Processed By",
                GetVariable(variables, "actor_name"),
                GetVariableOrEmpty(variables, "details_text"),
                "Payment Notes",
                variables,
                includePaymentReference: true,
                includeBillIdRow: false),

            var key when key == Constants.EmailTemplateKeys.InvoiceCreated => await BuildSafeInvoiceEmailContentAsync(
                org,
                logoMarkup,
                inlineLogo,
                GetVariable(variables, "invoice_status"),
                GetVariable(variables, "invoice_status").Equals("Sent", StringComparison.OrdinalIgnoreCase) ? "#2563eb" : "#475569",
                BuildNewSubject("Invoice", GetVariable(variables, "invoice_number")),
                "A new invoice has been created in the system.",
                "Created By",
                GetVariable(variables, "actor_name"),
                GetVariableOrEmpty(variables, "details_text"),
                "Notes",
                variables,
                includePaymentReference: false),

            var key when key == Constants.EmailTemplateKeys.InvoiceSent => await BuildSafeInvoiceEmailContentAsync(
                org,
                logoMarkup,
                inlineLogo,
                "Sent",
                "#2563eb",
                BuildStatusSubject("Sent", "Invoice", GetVariable(variables, "invoice_number")),
                "Please find your invoice details below.",
                "Sent By",
                GetVariable(variables, "actor_name"),
                GetVariableOrEmpty(variables, "details_text"),
                "Notes",
                variables,
                includePaymentReference: false),

            var key when key == Constants.EmailTemplateKeys.InvoicePaid => await BuildSafeInvoiceEmailContentAsync(
                org,
                logoMarkup,
                inlineLogo,
                GetVariable(variables, "invoice_status"),
                GetVariable(variables, "invoice_status").Equals("Partially Paid", StringComparison.OrdinalIgnoreCase) ? "#f59e0b" : "#22c55e",
                BuildStatusSubject(
                    GetVariable(variables, "invoice_status").Equals("Partially Paid", StringComparison.OrdinalIgnoreCase)
                        ? "Partially Paid"
                        : "Paid",
                    "Invoice",
                    GetVariable(variables, "invoice_number")),
                "Payment has been recorded for this invoice.",
                "Updated By",
                GetVariable(variables, "actor_name"),
                GetVariableOrEmpty(variables, "details_text"),
                "Payment Notes",
                variables,
                includePaymentReference: true),

            _ => null
        };
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

    private async Task<string> GetGraphTokenForAppAsync()
    {
        var tenantId = _config["ServerApp:TenantId"]!;
        var clientId = _config["ServerApp:ClientId"]!;
        var clientSecret = _config["ServerApp:ClientSecret"]!;

        var app = ConfidentialClientApplicationBuilder
            .Create(clientId)
            .WithClientSecret(clientSecret)
            .WithAuthority($"https://login.microsoftonline.com/{tenantId}")
            .Build();

        // App-only (application permissions) token.
        var result = await app
            .AcquireTokenForClient(new[] { "https://graph.microsoft.com/.default" })
            .ExecuteAsync();

        return result.AccessToken;
    }

    private string GetFinanceSenderEmail()
    {
        // Primary source: appsettings.json (Email:FromEmail)
        if (!string.IsNullOrWhiteSpace(_config["Email:FromEmail"]))
            return _config["Email:FromEmail"]!.Trim();

        // Optional override if you want a separate config key.
        if (!string.IsNullOrWhiteSpace(_config["Mail:FinanceSenderEmail"]))
            return _config["Mail:FinanceSenderEmail"]!.Trim();

        throw new InvalidOperationException("Missing required config: Email:FromEmail.");
    }

    private async Task SendViaGraphAsync(
        string to, string? cc,
        string subject, string htmlBody,
        string? attachmentPath, string graphToken,
        IReadOnlyList<EmailAttachment>? inlineAttachments = null)
    {
        var toRecipients = BuildRecipients(to);
        var ccRecipients = BuildRecipients(cc);

        if (toRecipients.Length == 0)
            throw new InvalidOperationException("No valid recipient email addresses were provided.");

        var attachments = new List<Dictionary<string, object>>();
        if (attachmentPath != null && File.Exists(attachmentPath))
        {
            var bytes = File.ReadAllBytes(attachmentPath);
            attachments.Add(new Dictionary<string, object>
            {
                ["@odata.type"] = "#microsoft.graph.fileAttachment",
                ["name"] = Path.GetFileName(attachmentPath),
                ["contentBytes"] = Convert.ToBase64String(bytes)
            });
        }

        if (inlineAttachments != null)
        {
            attachments.AddRange(inlineAttachments.Select(attachment => new Dictionary<string, object>
            {
                ["@odata.type"] = "#microsoft.graph.fileAttachment",
                ["name"] = attachment.Name,
                ["contentType"] = attachment.ContentType,
                ["contentBytes"] = attachment.ContentBytes,
                ["contentId"] = attachment.ContentId,
                ["isInline"] = true
            }));
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

    private async Task SendViaGraphAsAppAsync(
        string senderEmail,
        string to, string? cc,
        string subject, string htmlBody,
        string? attachmentPath, string graphToken,
        IReadOnlyList<EmailAttachment>? inlineAttachments = null)
    {
        var toRecipients = BuildRecipients(to);
        var ccRecipients = BuildRecipients(cc);

        if (toRecipients.Length == 0)
            throw new InvalidOperationException("No valid recipient email addresses were provided.");

        var attachments = new List<Dictionary<string, object>>();
        if (attachmentPath != null && File.Exists(attachmentPath))
        {
            var bytes = File.ReadAllBytes(attachmentPath);
            attachments.Add(new Dictionary<string, object>
            {
                ["@odata.type"] = "#microsoft.graph.fileAttachment",
                ["name"] = Path.GetFileName(attachmentPath),
                ["contentBytes"] = Convert.ToBase64String(bytes)
            });
        }

        if (inlineAttachments != null)
        {
            attachments.AddRange(inlineAttachments.Select(attachment => new Dictionary<string, object>
            {
                ["@odata.type"] = "#microsoft.graph.fileAttachment",
                ["name"] = attachment.Name,
                ["contentType"] = attachment.ContentType,
                ["contentBytes"] = attachment.ContentBytes,
                ["contentId"] = attachment.ContentId,
                ["isInline"] = true
            }));
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

        // App-only mail send from a specific mailbox.
        var senderPath = Uri.EscapeDataString(senderEmail);
        var response = await _httpClient.PostAsJsonAsync(
            $"https://graph.microsoft.com/v1.0/users/{senderPath}/sendMail",
            payload);

        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            _log.LogError("Graph sendMail (app) failed: {Error}", error);
            throw new Exception($"Graph sendMail (app) failed: {error}");
        }
    }

    private string ReplacePlaceholders(string template, Dictionary<string, string> variables)
    {
        foreach (var (key, value) in variables)
            template = template.Replace($"{{{{{key}}}}}", value);
        return template;
    }

    private static string BuildOrganizationDetails(Organization org)
    {
        var lines = new List<string>();

        if (!string.IsNullOrWhiteSpace(org.SubName))
            lines.Add(org.SubName);

        var addressLine = string.Join(", ", new[]
        {
            org.Address,
            org.City,
            org.State,
            org.Country,
            org.PostalCode
        }.Where(value => !string.IsNullOrWhiteSpace(value)));

        if (!string.IsNullOrWhiteSpace(addressLine))
            lines.Add(addressLine);

        var contactLine = string.Join(" | ", new[]
        {
            org.Phone,
            org.Website
        }.Where(value => !string.IsNullOrWhiteSpace(value)));

        if (!string.IsNullOrWhiteSpace(contactLine))
            lines.Add(contactLine);

        return string.Join("<br/>", lines.Select(Encode));
    }

    private static string GetVariable(Dictionary<string, string> variables, string key, string fallback = "N/A") =>
        variables.TryGetValue(key, out var value) && !string.IsNullOrWhiteSpace(value) ? value : fallback;

    private static string GetVariableOrEmpty(Dictionary<string, string> variables, string key) =>
        variables.TryGetValue(key, out var value) ? value : string.Empty;

    private static string BuildStatusSubject(string status, string entity, string identifier) =>
        $"{status} - {entity} : {identifier}";

    private static string BuildNewSubject(string entity, string identifier) =>
        $"NEW {entity.ToUpperInvariant()} - {identifier}";

    private static string BuildExpenseSubmittedSubject(string expenseCode) =>
        $"New Expense - {expenseCode} - Submitted";

    private static string BuildAdvanceSubmittedSubject(string advanceCode) =>
        $"New Advance Request - {advanceCode} - Submitted";

    /// <summary>Subject for vendor-facing email when a bill payment is recorded.</summary>
    private static string BuildVendorBillPaidSubject(Dictionary<string, string> variables)
    {
        var num = GetVariableOrEmpty(variables, "vendor_bill_number");
        if (string.IsNullOrWhiteSpace(num))
            num = GetVariable(variables, "bill_id");
        return $"Notification of Payment : {num} - Success";
    }

    private static void NormalizeActionDateToIst(Dictionary<string, string> variables)
    {
        if (!variables.ContainsKey("action_date"))
            return;

        var indiaTimeZone = TimeZoneInfo.FindSystemTimeZoneById("India Standard Time");
        variables["action_date"] = TimeZoneInfo
            .ConvertTimeFromUtc(DateTime.UtcNow, indiaTimeZone)
            .ToString("dd MMM yyyy hh:mm tt 'IST'");
    }

    /// <summary>
    /// Resolves the public app URL for email links: organization setting <c>frontendUrl</c> first, then <c>FrontendUrl</c> in configuration.
    /// </summary>
    private async Task<string> GetEmailAppBaseUrlAsync()
    {
        try
        {
            var orgId = await _tenant.GetCurrentOrganizationId();
            var fromSettings = await _db.OrganizationSettings
                .AsNoTracking()
                .Where(s => s.OrganizationId == orgId && s.Key == Constants.OrganizationSettingKeys.FrontendUrl)
                .Select(s => s.Value)
                .FirstOrDefaultAsync();
            if (!string.IsNullOrWhiteSpace(fromSettings))
                return fromSettings.Trim().TrimEnd('/');
        }
        catch (Exception ex)
        {
            _log.LogWarning(ex, "Could not read {Key} from organization settings; using config fallback.", Constants.OrganizationSettingKeys.FrontendUrl);
        }

        return _config["FrontendUrl"]?.Trim().TrimEnd('/') ?? "https://finance.qubiqon.io";
    }

    private async Task InjectViewLinkAsync(Dictionary<string, string> variables)
    {
        var baseUrl = await GetEmailAppBaseUrlAsync();

        // Prefer explicit entity id + type for deep links (?id=<guid>)
        if (variables.TryGetValue("entity_api_id", out var eid) && !string.IsNullOrWhiteSpace(eid)
            && variables.TryGetValue("entity_type", out var etype) && !string.IsNullOrWhiteSpace(etype))
        {
            var path = etype.Trim().ToLowerInvariant() switch
            {
                "expense" => "/expenses",
                "advance" => "/advances",
                "bill" => "/bills",
                "invoice" => "/invoices",
                _ => null
            };
            if (path != null)
            {
                var q = $"?id={Uri.EscapeDataString(eid.Trim())}";
                if (variables.TryGetValue("link_type", out var linkType) && !string.IsNullOrWhiteSpace(linkType))
                    q += $"&type={Uri.EscapeDataString(linkType.Trim())}";
                variables["view_link"] = $"{baseUrl}{path}{q}";
                return;
            }
        }

        if (variables.ContainsKey("expense_id"))
            variables["view_link"] = $"{baseUrl}/expenses";
        else if (variables.ContainsKey("advance_id"))
            variables["view_link"] = $"{baseUrl}/advances";
        else if (variables.ContainsKey("bill_id"))
            variables["view_link"] = $"{baseUrl}/bills";
        else if (variables.ContainsKey("invoice_id") || variables.ContainsKey("invoice_code") || variables.ContainsKey("invoice_number"))
            variables["view_link"] = $"{baseUrl}/invoices";
    }

    private static string Encode(string? value) => WebUtility.HtmlEncode(value ?? string.Empty);

    private static string EncodeMultiline(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return string.Empty;

        var parts = value
            .Replace("\r\n", "\n")
            .Split('\n', StringSplitOptions.RemoveEmptyEntries)
            .Select(Encode);

        return string.Join("<br/>", parts);
    }

    private static string GetInitials(string value)
    {
        var words = value.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        if (words.Length == 0) return "Q";
        if (words.Length == 1) return words[0][..1].ToUpperInvariant();
        return string.Concat(words[0][0], words[^1][0]).ToUpperInvariant();
    }

    private EmailContent BuildExpenseEmailContent(
        Organization org,
        string logoMarkup,
        EmailAttachment? inlineLogo,
        string statusText,
        string statusColor,
        string subject,
        string title,
        string intro,
        string nextStepMessage,
        string actorLabel,
        string actorName,
        string detailsText,
        string detailsHeading,
        Dictionary<string, string> variables,
        bool includePaymentReference)
    {
        var commentsSection = string.IsNullOrWhiteSpace(detailsText)
            ? string.Empty
            : $"""
               <div style="margin-top:20px;padding:16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
                   <div style="font-size:12px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#475569;margin-bottom:8px;">{Encode(detailsHeading)}</div>
                   <div style="font-size:14px;line-height:1.6;color:#0f172a;">{EncodeMultiline(detailsText)}</div>
               </div>
               """;

        var paymentReferenceRow = includePaymentReference
            ? BuildOptionalTableRow("Payment Reference", GetVariableOrEmpty(variables, "payment_reference"))
            : string.Empty;
        var paidAmountRow = includePaymentReference
            ? BuildOptionalTableRow("Paid Amount", GetVariableOrEmpty(variables, "paid_amount"))
            : string.Empty;
        var balanceDueRow = includePaymentReference
            ? BuildOptionalTableRow("Balance Due", GetVariableOrEmpty(variables, "balance_due"))
            : string.Empty;

        var viewLinkSection = BuildViewLinkSection(variables);
        var organizationDetails = BuildOrganizationDetails(org);

        var htmlBody = $$"""
            <!DOCTYPE html>
            <html>
            <body style="margin:0;padding:24px;background:#f1f5f9;font-family:Segoe UI,Arial,sans-serif;color:#0f172a;">
                <div style="max-width:720px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:18px;overflow:hidden;">
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
                        <tr>
                            <td style="width:140px;background:{{statusColor}};color:#ffffff;padding:12px 16px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;border-radius:18px 0 12px 0;">
                                {{statusText}}
                            </td>
                            <td style="background:#ffffff;">&nbsp;</td>
                        </tr>
                    </table>

                    <div style="padding:16px 28px 24px;border-bottom:1px solid #e2e8f0;background:#f8fafc;">
                        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                                <td style="vertical-align:top;width:96px;">{{logoMarkup}}</td>
                                <td style="vertical-align:top;">
                                    <div style="font-size:24px;font-weight:700;color:#0f172a;">{{Encode(org.OrgName)}}</div>
                                    <div style="margin-top:6px;font-size:14px;line-height:1.6;color:#475569;">{{organizationDetails}}</div>
                                </td>
                            </tr>
                        </table>
                    </div>

                    <div style="padding:32px 28px;">
                        <h1 style="margin:0 0 12px;font-size:28px;line-height:1.2;">{{Encode(title)}}</h1>
                        <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#334155;">{{intro}}</p>
                        <p style="margin:0 0 24px;font-size:14px;line-height:1.7;color:#475569;">{{Encode(nextStepMessage)}}</p>

                        <div style="border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;">
                            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
                                <tr>
                                    <td style="padding:14px 16px;background:#f8fafc;font-size:13px;font-weight:600;color:#475569;width:35%;">Employee</td>
                                    <td style="padding:14px 16px;font-size:14px;color:#0f172a;">{{Encode(GetVariable(variables, "employee_name"))}}</td>
                                </tr>
                                <tr>
                                    <td style="padding:14px 16px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:13px;font-weight:600;color:#475569;">Expense ID</td>
                                    <td style="padding:14px 16px;border-top:1px solid #e2e8f0;font-size:14px;color:#0f172a;">{{Encode(GetVariable(variables, "expense_id"))}}</td>
                                </tr>
                                <tr>
                                    <td style="padding:14px 16px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:13px;font-weight:600;color:#475569;">Purpose</td>
                                    <td style="padding:14px 16px;border-top:1px solid #e2e8f0;font-size:14px;color:#0f172a;">{{Encode(GetVariable(variables, "purpose"))}}</td>
                                </tr>
                                <tr>
                                    <td style="padding:14px 16px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:13px;font-weight:600;color:#475569;">Amount</td>
                                    <td style="padding:14px 16px;border-top:1px solid #e2e8f0;font-size:14px;color:#0f172a;">{{Encode(GetVariable(variables, "amount"))}}</td>
                                </tr>
                                <tr>
                                    <td style="padding:14px 16px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:13px;font-weight:600;color:#475569;">Bill Date</td>
                                    <td style="padding:14px 16px;border-top:1px solid #e2e8f0;font-size:14px;color:#0f172a;">{{Encode(GetVariable(variables, "bill_date"))}}</td>
                                </tr>
                                {{paidAmountRow}}
                                {{balanceDueRow}}
                                {{paymentReferenceRow}}
                                <tr>
                                    <td style="padding:14px 16px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:13px;font-weight:600;color:#475569;">{{Encode(actorLabel)}}</td>
                                    <td style="padding:14px 16px;border-top:1px solid #e2e8f0;font-size:14px;color:#0f172a;">{{Encode(actorName)}}</td>
                                </tr>
                                <tr>
                                    <td style="padding:14px 16px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:13px;font-weight:600;color:#475569;">Updated On</td>
                                    <td style="padding:14px 16px;border-top:1px solid #e2e8f0;font-size:14px;color:#0f172a;">{{Encode(GetVariable(variables, "action_date"))}}</td>
                                </tr>
                            </table>
                        </div>

                        {{commentsSection}}
                        {{viewLinkSection}}

                        <div style="margin-top:24px;padding-top:20px;border-top:1px solid #e2e8f0;font-size:13px;line-height:1.7;color:#64748b;">
                            This is an automated notification from {{Encode(org.OrgName)}}.
                        </div>
                    </div>
                </div>
            </body>
            </html>
            """;

        return new EmailContent(
            subject,
            htmlBody,
            inlineLogo == null ? [] : [inlineLogo]);
    }

    private static string BuildViewLinkSection(Dictionary<string, string> variables)
    {
        if (!variables.TryGetValue("view_link", out var link) || string.IsNullOrWhiteSpace(link))
            return string.Empty;
        var url = Encode(link);
        return $"""
            <div style="margin-top:24px;">
                <a href="{url}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;">View in Finance Hub</a>
            </div>
            """;
    }

    private EmailContent BuildAdvanceEmailContent(
        Organization org,
        string logoMarkup,
        EmailAttachment? inlineLogo,
        string statusText,
        string statusColor,
        string subject,
        string title,
        string intro,
        string nextStepMessage,
        string actorLabel,
        string actorName,
        string detailsText,
        string detailsHeading,
        Dictionary<string, string> variables,
        bool includePaymentReference)
    {
        var detailsSection = string.IsNullOrWhiteSpace(detailsText)
            ? string.Empty
            : $"""
               <div style="margin-top:20px;padding:16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
                   <div style="font-size:12px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#475569;margin-bottom:8px;">{Encode(detailsHeading)}</div>
                   <div style="font-size:14px;line-height:1.6;color:#0f172a;">{EncodeMultiline(detailsText)}</div>
               </div>
               """;

        var paymentReferenceRow = includePaymentReference
            ? BuildOptionalTableRow("Payment Reference", GetVariableOrEmpty(variables, "payment_reference"))
            : string.Empty;
        var paidAmountRow = includePaymentReference
            ? BuildOptionalTableRow("Paid Amount", GetVariableOrEmpty(variables, "paid_amount"))
            : string.Empty;
        var balanceDueRow = includePaymentReference
            ? BuildOptionalTableRow("Balance Due", GetVariableOrEmpty(variables, "balance_due"))
            : string.Empty;

        var viewLinkSection = BuildViewLinkSection(variables);
        var organizationDetails = BuildOrganizationDetails(org);

        var htmlBody = $$"""
            <!DOCTYPE html>
            <html>
            <body style="margin:0;padding:24px;background:#f1f5f9;font-family:Segoe UI,Arial,sans-serif;color:#0f172a;">
                <div style="max-width:720px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:18px;overflow:hidden;">
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
                        <tr>
                            <td style="width:140px;background:{{statusColor}};color:#ffffff;padding:12px 16px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;border-radius:18px 0 12px 0;">
                                {{statusText}}
                            </td>
                            <td style="background:#ffffff;">&nbsp;</td>
                        </tr>
                    </table>

                    <div style="padding:16px 28px 24px;border-bottom:1px solid #e2e8f0;background:#f8fafc;">
                        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                                <td style="vertical-align:top;width:96px;">{{logoMarkup}}</td>
                                <td style="vertical-align:top;">
                                    <div style="font-size:24px;font-weight:700;color:#0f172a;">{{Encode(org.OrgName)}}</div>
                                    <div style="margin-top:6px;font-size:14px;line-height:1.6;color:#475569;">{{organizationDetails}}</div>
                                </td>
                            </tr>
                        </table>
                    </div>

                    <div style="padding:32px 28px;">
                        <h1 style="margin:0 0 12px;font-size:28px;line-height:1.2;">{{Encode(title)}}</h1>
                        <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#334155;">{{intro}}</p>
                        <p style="margin:0 0 24px;font-size:14px;line-height:1.7;color:#475569;">{{Encode(nextStepMessage)}}</p>

                        <div style="border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;">
                            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
                                <tr>
                                    <td style="padding:14px 16px;background:#f8fafc;font-size:13px;font-weight:600;color:#475569;width:35%;">Employee</td>
                                    <td style="padding:14px 16px;font-size:14px;color:#0f172a;">{{Encode(GetVariable(variables, "employee_name"))}}</td>
                                </tr>
                                <tr>
                                    <td style="padding:14px 16px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:13px;font-weight:600;color:#475569;">Advance ID</td>
                                    <td style="padding:14px 16px;border-top:1px solid #e2e8f0;font-size:14px;color:#0f172a;">{{Encode(GetVariable(variables, "advance_id"))}}</td>
                                </tr>
                                <tr>
                                    <td style="padding:14px 16px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:13px;font-weight:600;color:#475569;">Purpose</td>
                                    <td style="padding:14px 16px;border-top:1px solid #e2e8f0;font-size:14px;color:#0f172a;">{{Encode(GetVariable(variables, "purpose"))}}</td>
                                </tr>
                                <tr>
                                    <td style="padding:14px 16px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:13px;font-weight:600;color:#475569;">Amount</td>
                                    <td style="padding:14px 16px;border-top:1px solid #e2e8f0;font-size:14px;color:#0f172a;">{{Encode(GetVariable(variables, "amount"))}}</td>
                                </tr>
                                <tr>
                                    <td style="padding:14px 16px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:13px;font-weight:600;color:#475569;">Requested On</td>
                                    <td style="padding:14px 16px;border-top:1px solid #e2e8f0;font-size:14px;color:#0f172a;">{{Encode(GetVariable(variables, "request_date"))}}</td>
                                </tr>
                                {{paidAmountRow}}
                                {{balanceDueRow}}
                                {{paymentReferenceRow}}
                                <tr>
                                    <td style="padding:14px 16px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:13px;font-weight:600;color:#475569;">{{Encode(actorLabel)}}</td>
                                    <td style="padding:14px 16px;border-top:1px solid #e2e8f0;font-size:14px;color:#0f172a;">{{Encode(actorName)}}</td>
                                </tr>
                                <tr>
                                    <td style="padding:14px 16px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:13px;font-weight:600;color:#475569;">Updated On</td>
                                    <td style="padding:14px 16px;border-top:1px solid #e2e8f0;font-size:14px;color:#0f172a;">{{Encode(GetVariable(variables, "action_date"))}}</td>
                                </tr>
                            </table>
                        </div>

                        {{detailsSection}}
                        {{viewLinkSection}}

                        <div style="margin-top:24px;padding-top:20px;border-top:1px solid #e2e8f0;font-size:13px;line-height:1.7;color:#64748b;">
                            This is an automated notification from {{Encode(org.OrgName)}}.
                        </div>
                    </div>
                </div>
            </body>
            </html>
            """;

        return new EmailContent(
            subject,
            htmlBody,
            inlineLogo == null ? [] : [inlineLogo]);
    }

    private EmailContent BuildVendorBillEmailContent(
        Organization org,
        string logoMarkup,
        EmailAttachment? inlineLogo,
        string statusText,
        string statusColor,
        string subject,
        string title,
        string intro,
        string nextStepMessage,
        string actorLabel,
        string actorName,
        string detailsText,
        string detailsHeading,
        Dictionary<string, string> variables,
        bool includePaymentReference,
        bool includeBillIdRow = true)
    {
        var detailsSection = string.IsNullOrWhiteSpace(detailsText)
            ? string.Empty
            : $"""
               <div style="margin-top:20px;padding:16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
                   <div style="font-size:12px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#475569;margin-bottom:8px;">{Encode(detailsHeading)}</div>
                   <div style="font-size:14px;line-height:1.6;color:#0f172a;">{EncodeMultiline(detailsText)}</div>
               </div>
               """;

        var billIdRow = includeBillIdRow
            ? $"""
                <tr>
                    <td style="padding:14px 16px;background:#f8fafc;font-size:13px;font-weight:600;color:#475569;width:35%;vertical-align:top;text-align:left;">Bill ID</td>
                    <td style="padding:14px 16px;font-size:14px;color:#0f172a;width:65%;vertical-align:top;text-align:left;">{Encode(GetVariable(variables, "bill_id"))}</td>
                </tr>
                """
            : string.Empty;

        var paymentReferenceRow = includePaymentReference
            ? BuildOptionalTableRow("Payment Reference", GetVariableOrEmpty(variables, "payment_reference"))
            : string.Empty;
        var paidAmountRow = includePaymentReference
            ? BuildOptionalTableRow("Paid Amount", GetVariableOrEmpty(variables, "paid_amount"))
            : string.Empty;
        var balanceDueRow = includePaymentReference
            ? BuildOptionalTableRow("Balance Due", GetVariableOrEmpty(variables, "balance_due"))
            : string.Empty;

        var vendorBillNumberRow = BuildOptionalTableRow("Vendor Bill Number", GetVariableOrEmpty(variables, "vendor_bill_number"));
        var discountPercentRow = BuildOptionalTableRow("Discount %", GetVariableOrEmpty(variables, "discount_percent"));
        var roundingRow = BuildOptionalTableRow("Rounding", GetVariableOrEmpty(variables, "rounding"));
        var lineItemsHtml = GetVariableOrEmpty(variables, "line_items_html");
        var gstBreakdownRowsHtml = GetVariableOrEmpty(variables, "gst_breakdown_rows_html");
        var tdsRowHtml = GetVariableOrEmpty(variables, "tds_row_html");
        var viewLinkSection = BuildViewLinkSection(variables);
        var organizationDetails = BuildOrganizationDetails(org);

        var htmlBody = $$"""
            <!DOCTYPE html>
            <html>
            <body style="margin:0;padding:24px;background:#f1f5f9;font-family:Segoe UI,Arial,sans-serif;color:#0f172a;">
                <div style="max-width:720px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:18px;overflow:hidden;">
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
                        <tr>
                            <td style="width:140px;background:{{statusColor}};color:#ffffff;padding:12px 16px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;border-radius:18px 0 12px 0;">
                                {{statusText}}
                            </td>
                            <td style="background:#ffffff;">&nbsp;</td>
                        </tr>
                    </table>

                    <div style="padding:16px 28px 24px;border-bottom:1px solid #e2e8f0;background:#f8fafc;">
                        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                                <td style="vertical-align:top;width:96px;">{{logoMarkup}}</td>
                                <td style="vertical-align:top;">
                                    <div style="font-size:24px;font-weight:700;color:#0f172a;">{{Encode(org.OrgName)}}</div>
                                    <div style="margin-top:6px;font-size:14px;line-height:1.6;color:#475569;">{{organizationDetails}}</div>
                                </td>
                            </tr>
                        </table>
                    </div>

                    <div style="padding:32px 28px;">
                        <h1 style="margin:0 0 12px;font-size:28px;line-height:1.2;">{{Encode(title)}}</h1>
                        <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#334155;">{{intro}}</p>
                        <p style="margin:0 0 24px;font-size:14px;line-height:1.7;color:#475569;">{{Encode(nextStepMessage)}}</p>

                        <div style="border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;">
                            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;table-layout:fixed;width:100%;">
                                {{billIdRow}}
                                {{vendorBillNumberRow}}
                                <tr>
                                    <td style="padding:14px 16px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:13px;font-weight:600;color:#475569;width:35%;vertical-align:top;text-align:left;">Vendor</td>
                                    <td style="padding:14px 16px;border-top:1px solid #e2e8f0;font-size:14px;color:#0f172a;width:65%;vertical-align:top;text-align:left;">{{Encode(GetVariable(variables, "vendor_name"))}}</td>
                                </tr>
                                <tr>
                                    <td style="padding:14px 16px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:13px;font-weight:600;color:#475569;width:35%;vertical-align:top;text-align:left;">Description</td>
                                    <td style="padding:14px 16px;border-top:1px solid #e2e8f0;font-size:14px;color:#0f172a;width:65%;vertical-align:top;text-align:left;">{{Encode(GetVariable(variables, "description"))}}</td>
                                </tr>
                                <tr>
                                    <td style="padding:14px 16px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:13px;font-weight:600;color:#475569;width:35%;vertical-align:top;text-align:left;">Sub total (items)</td>
                                    <td style="padding:14px 16px;border-top:1px solid #e2e8f0;font-size:14px;color:#0f172a;width:65%;vertical-align:top;text-align:left;">{{Encode(GetVariableOrEmpty(variables, "sub_total"))}}</td>
                                </tr>
                                {{gstBreakdownRowsHtml}}
                                <tr>
                                    <td style="padding:14px 16px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:13px;font-weight:600;color:#475569;width:35%;vertical-align:top;text-align:left;">Total GST</td>
                                    <td style="padding:14px 16px;border-top:1px solid #e2e8f0;font-size:14px;color:#0f172a;width:65%;vertical-align:top;text-align:left;">{{Encode(GetVariableOrEmpty(variables, "total_line_gst"))}}</td>
                                </tr>
                                {{discountPercentRow}}
                                {{roundingRow}}
                                <tr>
                                    <td style="padding:14px 16px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:13px;font-weight:600;color:#475569;width:35%;vertical-align:top;text-align:left;">Total (before TDS)</td>
                                    <td style="padding:14px 16px;border-top:1px solid #e2e8f0;font-size:14px;color:#0f172a;width:65%;vertical-align:top;text-align:left;">{{Encode(GetVariable(variables, "amount"))}}</td>
                                </tr>
                                {{tdsRowHtml}}
                                <tr>
                                    <td style="padding:14px 16px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:13px;font-weight:600;color:#475569;width:35%;vertical-align:top;text-align:left;">Total Payable</td>
                                    <td style="padding:14px 16px;border-top:1px solid #e2e8f0;font-size:14px;color:#0f172a;width:65%;vertical-align:top;text-align:left;">{{Encode(GetVariable(variables, "total_payable"))}}</td>
                                </tr>
                                {{paidAmountRow}}
                                {{balanceDueRow}}
                                <tr>
                                    <td style="padding:14px 16px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:13px;font-weight:600;color:#475569;width:35%;vertical-align:top;text-align:left;">Bill Date</td>
                                    <td style="padding:14px 16px;border-top:1px solid #e2e8f0;font-size:14px;color:#0f172a;width:65%;vertical-align:top;text-align:left;">{{Encode(GetVariable(variables, "bill_date"))}}</td>
                                </tr>
                                <tr>
                                    <td style="padding:14px 16px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:13px;font-weight:600;color:#475569;width:35%;vertical-align:top;text-align:left;">Due Date</td>
                                    <td style="padding:14px 16px;border-top:1px solid #e2e8f0;font-size:14px;color:#0f172a;width:65%;vertical-align:top;text-align:left;">{{Encode(GetVariable(variables, "due_date"))}}</td>
                                </tr>
                                {{paymentReferenceRow}}
                                <tr>
                                    <td style="padding:14px 16px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:13px;font-weight:600;color:#475569;width:35%;vertical-align:top;text-align:left;">{{Encode(actorLabel)}}</td>
                                    <td style="padding:14px 16px;border-top:1px solid #e2e8f0;font-size:14px;color:#0f172a;width:65%;vertical-align:top;text-align:left;">{{Encode(actorName)}}</td>
                                </tr>
                                <tr>
                                    <td style="padding:14px 16px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:13px;font-weight:600;color:#475569;width:35%;vertical-align:top;text-align:left;">Updated On</td>
                                    <td style="padding:14px 16px;border-top:1px solid #e2e8f0;font-size:14px;color:#0f172a;width:65%;vertical-align:top;text-align:left;">{{Encode(GetVariable(variables, "action_date"))}}</td>
                                </tr>
                            </table>
                        </div>

                        {{lineItemsHtml}}

                        {{detailsSection}}
                        {{viewLinkSection}}

                        <div style="margin-top:24px;padding-top:20px;border-top:1px solid #e2e8f0;font-size:13px;line-height:1.7;color:#64748b;">
                            This is an automated notification from {{Encode(org.OrgName)}}.
                        </div>
                    </div>
                </div>
            </body>
            </html>
            """;

        return new EmailContent(
            subject,
            htmlBody,
            inlineLogo == null ? [] : [inlineLogo]);
    }

    private async Task<EmailContent> BuildInvoiceEmailContentAsync(
        Organization org,
        string logoMarkup,
        EmailAttachment? inlineLogo,
        string statusText,
        string statusColor,
        string subject,
        string intro,
        string actorLabel,
        string actorName,
        string detailsText,
        string detailsHeading,
        Dictionary<string, string> variables,
        bool includePaymentReference)
    {
        var settings = (await _db.OrganizationSettings
            .Where(x => x.OrganizationId == org.Id)
            .ToListAsync())
            .GroupBy(x => x.Key)
            .ToDictionary(group => group.Key, group => group.Last().Value);

        var normalizedStatusText = statusText.Equals("PartiallyPaid", StringComparison.OrdinalIgnoreCase)
            ? "Partially Paid"
            : statusText;

        var paymentAddress = !string.IsNullOrWhiteSpace(org.PaymentAddress) && org.UseSeparatePaymentAddress
            ? org.PaymentAddress
            : org.Address;

        var paymentAddressHtml = BuildAddressHtml(
            paymentAddress,
            org.City,
            org.State,
            org.Country,
            org.PostalCode);

        var clientBillingHtml = BuildAddressHtml(GetVariableOrEmpty(variables, "client_billing_address"));
        var clientShippingHtml = BuildAddressHtml(GetVariableOrEmpty(variables, "client_shipping_address"));
        var bankDetailsHtml = BuildInvoiceBankDetailsHtml(settings);

        var detailsSection = string.IsNullOrWhiteSpace(detailsText)
            ? string.Empty
            : $"""
               <div style="margin-top:16px;padding:14px 16px;border-top:1px solid #e2e8f0;font-size:12px;line-height:1.7;color:#334155;">
                   <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:#64748b;margin-bottom:6px;">{Encode(detailsHeading)}</div>
                   <div>{EncodeMultiline(detailsText)}</div>
               </div>
               """;

        var paymentReferenceLine = includePaymentReference && !string.IsNullOrWhiteSpace(GetVariableOrEmpty(variables, "payment_reference"))
            ? $"""<div style="margin-top:12px;font-size:11px;color:#64748b;">Payment ref: <strong style="color:#0f172a;">{Encode(GetVariableOrEmpty(variables, "payment_reference"))}</strong></div>"""
            : string.Empty;

        var viewLinkSection = BuildViewLinkSection(variables);
        var gstLineBreakdownHtml = GetVariableOrEmpty(variables, "gst_line_breakdown_html");

        var htmlBody = $$"""
            <!DOCTYPE html>
            <html>
            <body style="margin:0;padding:24px;background:#f1f5f9;font-family:Segoe UI,Arial,sans-serif;color:#0f172a;">
                <div style="max-width:780px;margin:0 auto;background:#ffffff;border:1px solid #cbd5e1;overflow:hidden;">
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
                        <tr>
                            <td style="width:140px;background:{{statusColor}};color:#ffffff;padding:12px 16px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;border-radius:18px 0 12px 0;">
                                {{Encode(normalizedStatusText)}}
                            </td>
                            <td style="padding:0;">&nbsp;</td>
                        </tr>
                    </table>

                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;border-top:1px solid #cbd5e1;border-bottom:1px solid #cbd5e1;">
                        <tr>
                            <td style="padding:18px 20px;vertical-align:top;width:70%;">
                                <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                                    <tr>
                                        <td style="width:86px;vertical-align:top;">{{logoMarkup}}</td>
                                        <td style="vertical-align:top;">
                                            <div style="font-size:18px;font-weight:700;line-height:1.1;color:#111827;">{{Encode(org.OrgName)}}</div>
                                            <div style="margin-top:8px;font-size:12px;line-height:1.5;color:#111827;">{{BuildOrganizationDetails(org)}}</div>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                            <td style="padding:18px 20px;vertical-align:middle;text-align:right;font-size:30px;letter-spacing:0.02em;color:#111827;">
                                INVOICE
                            </td>
                        </tr>
                    </table>

                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;border-bottom:1px solid #cbd5e1;">
                        <tr>
                            <td style="width:52%;padding:0;border-right:1px solid #cbd5e1;vertical-align:top;">
                                <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
                                    <tr>
                                        <td style="padding:10px 14px;font-size:12px;color:#475569;width:120px;">Invoice#</td>
                                        <td style="padding:10px 14px;font-size:12px;font-weight:600;color:#111827;">: {{Encode(GetVariable(variables, "invoice_number"))}}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding:0 14px 8px;font-size:12px;color:#475569;">Invoice Date</td>
                                        <td style="padding:0 14px 8px;font-size:12px;font-weight:600;color:#111827;">: {{Encode(GetVariable(variables, "invoice_date"))}}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding:0 14px 8px;font-size:12px;color:#475569;">Terms</td>
                                        <td style="padding:0 14px 8px;font-size:12px;font-weight:600;color:#111827;">: {{Encode(GetVariable(variables, "payment_terms"))}}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding:0 14px 8px;font-size:12px;color:#475569;">Due Date</td>
                                        <td style="padding:0 14px 8px;font-size:12px;font-weight:600;color:#111827;">: {{Encode(GetVariable(variables, "due_date"))}}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding:0 14px 12px;font-size:12px;color:#475569;">P.O #</td>
                                        <td style="padding:0 14px 12px;font-size:12px;font-weight:600;color:#111827;">: {{Encode(GetVariable(variables, "purchase_order"))}}</td>
                                    </tr>
                                </table>
                            </td>
                            <td style="padding:10px 14px;vertical-align:bottom;text-align:right;font-size:13px;font-weight:600;color:#111827;">
                                {{Encode(GetVariable(variables, "currency"))}} invoice
                            </td>
                        </tr>
                    </table>

                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;border-bottom:1px solid #cbd5e1;">
                        <tr>
                            <td style="width:50%;padding:12px 14px;vertical-align:top;border-right:1px solid #cbd5e1;">
                                <div style="font-size:11px;font-weight:700;color:#475569;text-transform:uppercase;margin-bottom:6px;">Bill To</div>
                                <div style="font-size:15px;font-weight:700;color:#2563eb;">{{Encode(GetVariable(variables, "client_name"))}}</div>
                                <div style="margin-top:4px;font-size:12px;line-height:1.6;color:#111827;">
                                    {{clientBillingHtml}}
                                </div>
                                <div style="margin-top:4px;font-size:12px;color:#111827;">{{Encode(GetVariableOrEmpty(variables, "client_email"))}}</div>
                            </td>
                            <td style="padding:12px 14px;vertical-align:top;">
                                <div style="font-size:11px;font-weight:700;color:#475569;text-transform:uppercase;margin-bottom:6px;">Ship To</div>
                                <div style="font-size:12px;line-height:1.6;color:#111827;">
                                    {{clientShippingHtml}}
                                </div>
                            </td>
                        </tr>
                    </table>

                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;font-size:12px;">
                        <thead>
                            <tr style="background:#f8fafc;">
                                <th style="padding:10px 12px;text-align:left;border-bottom:1px solid #cbd5e1;">#</th>
                                <th style="padding:10px 12px;text-align:left;border-bottom:1px solid #cbd5e1;">Item &amp; Description</th>
                                <th style="padding:10px 12px;text-align:left;border-bottom:1px solid #cbd5e1;">HSN/SAC</th>
                                <th style="padding:10px 12px;text-align:right;border-bottom:1px solid #cbd5e1;">Qty</th>
                                <th style="padding:10px 12px;text-align:right;border-bottom:1px solid #cbd5e1;">Rate</th>
                                <th style="padding:10px 12px;text-align:right;border-bottom:1px solid #cbd5e1;">GST</th>
                                <th style="padding:10px 12px;text-align:right;border-bottom:1px solid #cbd5e1;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {{GetVariableOrEmpty(variables, "line_items_html")}}
                        </tbody>
                    </table>

                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;border-top:1px solid #cbd5e1;">
                        <tr>
                            <td style="width:58%;padding:16px 18px;vertical-align:top;border-right:1px solid #cbd5e1;">
                                <div style="font-size:12px;color:#475569;margin-bottom:4px;">Total In Words</div>
                                <div style="font-size:14px;font-style:italic;font-weight:700;color:#111827;">{{Encode(GetVariableOrEmpty(variables, "total_in_words"))}}</div>
                                <div style="margin-top:16px;font-size:12px;color:#475569;">Notes</div>
                                <div style="margin-top:4px;font-size:12px;line-height:1.7;color:#111827;">{{EncodeMultiline(GetVariableOrEmpty(variables, "notes"))}}</div>
                                <div style="margin-top:16px;font-size:12px;color:#475569;">Payment Address</div>
                                <div style="margin-top:4px;font-size:12px;line-height:1.7;color:#111827;">{{paymentAddressHtml}}</div>
                                {{detailsSection}}
                                {{bankDetailsHtml}}
                            </td>
                            <td style="padding:16px 18px;vertical-align:top;">
                                <div style="display:flex;justify-content:space-between;font-size:12px;color:#111827;margin-bottom:8px;"><span>Sub Total</span><strong>{{Encode(GetVariable(variables, "sub_total"))}}</strong></div>
                                {{gstLineBreakdownHtml}}
                                <div style="display:flex;justify-content:space-between;font-size:12px;color:#111827;margin-bottom:8px;"><span>GST (total)</span><strong>{{Encode(GetVariable(variables, "total_gst"))}}</strong></div>
                                <div style="display:flex;justify-content:space-between;font-size:15px;color:#111827;font-weight:700;margin-bottom:8px;"><span>Total</span><strong>{{Encode(GetVariable(variables, "amount"))}}</strong></div>
                                <div style="display:flex;justify-content:space-between;font-size:12px;color:#dc2626;margin-bottom:8px;"><span>Payment Made</span><strong>({{Encode(GetVariable(variables, "payment_made"))}})</strong></div>
                                <div style="display:flex;justify-content:space-between;font-size:15px;color:#111827;font-weight:700;margin-bottom:8px;"><span>Balance Due</span><strong>{{Encode(GetVariable(variables, "balance_due"))}}</strong></div>
                                {{paymentReferenceLine}}
                                <div style="margin-top:52px;padding-top:28px;border-top:1px solid #cbd5e1;text-align:center;">
                                    <div style="font-size:12px;color:#64748b;margin-bottom:22px;">{{Encode(intro)}}</div>
                                    <div style="border-top:1px solid #111827;width:160px;margin:0 auto 6px;"></div>
                                    <div style="font-size:11px;font-weight:600;color:#111827;">Authorized Signature</div>
                                </div>
                            </td>
                        </tr>
                    </table>
                    {{viewLinkSection}}
                </div>
            </body>
            </html>
            """;

        return new EmailContent(
            subject,
            htmlBody,
            inlineLogo == null ? [] : [inlineLogo]);
    }

    private async Task<EmailContent> BuildSafeInvoiceEmailContentAsync(
        Organization org,
        string logoMarkup,
        EmailAttachment? inlineLogo,
        string statusText,
        string statusColor,
        string subject,
        string intro,
        string actorLabel,
        string actorName,
        string detailsText,
        string detailsHeading,
        Dictionary<string, string> variables,
        bool includePaymentReference)
    {
        try
        {
            return await BuildInvoiceEmailContentAsync(
                org,
                logoMarkup,
                inlineLogo,
                statusText,
                statusColor,
                subject,
                intro,
                actorLabel,
                actorName,
                detailsText,
                detailsHeading,
                variables,
                includePaymentReference);
        }
        catch (Exception ex)
        {
            _log.LogWarning(ex, "Falling back to simple invoice email template for {Invoice}.", GetVariable(variables, "invoice_number"));

            return BuildSimpleInvoiceEmailContent(
                org,
                logoMarkup,
                inlineLogo,
                statusText,
                statusColor,
                subject,
                intro,
                actorLabel,
                actorName,
                detailsText,
                detailsHeading,
                variables,
                includePaymentReference);
        }
    }

    private EmailContent BuildSimpleInvoiceEmailContent(
        Organization org,
        string logoMarkup,
        EmailAttachment? inlineLogo,
        string statusText,
        string statusColor,
        string subject,
        string intro,
        string actorLabel,
        string actorName,
        string detailsText,
        string detailsHeading,
        Dictionary<string, string> variables,
        bool includePaymentReference)
    {
        var detailsSection = string.IsNullOrWhiteSpace(detailsText)
            ? string.Empty
            : $"""
               <div style="margin-top:20px;padding:16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
                   <div style="font-size:12px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#475569;margin-bottom:8px;">{Encode(detailsHeading)}</div>
                   <div style="font-size:14px;line-height:1.6;color:#0f172a;">{EncodeMultiline(detailsText)}</div>
               </div>
               """;

        var paymentReferenceRow = includePaymentReference
            ? BuildOptionalTableRow("Payment Reference", GetVariableOrEmpty(variables, "payment_reference"))
            : string.Empty;

        var htmlBody = $$"""
            <!DOCTYPE html>
            <html>
            <body style="margin:0;padding:24px;background:#f1f5f9;font-family:Segoe UI,Arial,sans-serif;color:#0f172a;">
                <div style="max-width:720px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:18px;overflow:hidden;">
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
                        <tr>
                            <td style="width:140px;background:{{statusColor}};color:#ffffff;padding:12px 16px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;border-radius:18px 0 12px 0;">
                                {{Encode(statusText)}}
                            </td>
                            <td style="background:#ffffff;">&nbsp;</td>
                        </tr>
                    </table>

                    <div style="padding:16px 28px 24px;border-bottom:1px solid #e2e8f0;background:#f8fafc;">
                        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                                <td style="vertical-align:top;width:96px;">{{logoMarkup}}</td>
                                <td style="vertical-align:top;">
                                    <div style="font-size:24px;font-weight:700;color:#0f172a;">{{Encode(org.OrgName)}}</div>
                                    <div style="margin-top:6px;font-size:14px;line-height:1.6;color:#475569;">{{BuildOrganizationDetails(org)}}</div>
                                </td>
                            </tr>
                        </table>
                    </div>

                    <div style="padding:32px 28px;">
                        <h1 style="margin:0 0 12px;font-size:28px;line-height:1.2;">Invoice {{Encode(GetVariable(variables, "invoice_number"))}}</h1>
                        <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#334155;">{{intro}}</p>

                        <div style="border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;">
                            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
                                <tr>
                                    <td style="padding:14px 16px;background:#f8fafc;font-size:13px;font-weight:600;color:#475569;width:35%;">Client</td>
                                    <td style="padding:14px 16px;font-size:14px;color:#0f172a;">{{Encode(GetVariable(variables, "client_name"))}}</td>
                                </tr>
                                <tr>
                                    <td style="padding:14px 16px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:13px;font-weight:600;color:#475569;">Invoice Date</td>
                                    <td style="padding:14px 16px;border-top:1px solid #e2e8f0;font-size:14px;color:#0f172a;">{{Encode(GetVariable(variables, "invoice_date"))}}</td>
                                </tr>
                                <tr>
                                    <td style="padding:14px 16px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:13px;font-weight:600;color:#475569;">Due Date</td>
                                    <td style="padding:14px 16px;border-top:1px solid #e2e8f0;font-size:14px;color:#0f172a;">{{Encode(GetVariable(variables, "due_date"))}}</td>
                                </tr>
                                <tr>
                                    <td style="padding:14px 16px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:13px;font-weight:600;color:#475569;">Amount</td>
                                    <td style="padding:14px 16px;border-top:1px solid #e2e8f0;font-size:14px;color:#0f172a;">{{Encode(GetVariable(variables, "amount"))}}</td>
                                </tr>
                                <tr>
                                    <td style="padding:14px 16px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:13px;font-weight:600;color:#475569;">Balance Due</td>
                                    <td style="padding:14px 16px;border-top:1px solid #e2e8f0;font-size:14px;color:#0f172a;">{{Encode(GetVariable(variables, "balance_due"))}}</td>
                                </tr>
                                {{paymentReferenceRow}}
                                <tr>
                                    <td style="padding:14px 16px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:13px;font-weight:600;color:#475569;">{{Encode(actorLabel)}}</td>
                                    <td style="padding:14px 16px;border-top:1px solid #e2e8f0;font-size:14px;color:#0f172a;">{{Encode(actorName)}}</td>
                                </tr>
                                <tr>
                                    <td style="padding:14px 16px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:13px;font-weight:600;color:#475569;">Updated On</td>
                                    <td style="padding:14px 16px;border-top:1px solid #e2e8f0;font-size:14px;color:#0f172a;">{{Encode(GetVariable(variables, "action_date"))}}</td>
                                </tr>
                            </table>
                        </div>

                        {{detailsSection}}
                    </div>
                </div>
            </body>
            </html>
            """;

        return new EmailContent(
            subject,
            htmlBody,
            inlineLogo == null ? [] : [inlineLogo]);
    }

    private static string BuildAddressHtml(params string?[] parts)
    {
        var lines = parts
            .SelectMany(part => (part ?? string.Empty).Replace("\r\n", "\n").Split('\n'))
            .Select(line => line.Trim())
            .Where(line => !string.IsNullOrWhiteSpace(line))
            .Select(Encode)
            .ToList();

        return lines.Count == 0 ? "NA" : string.Join("<br/>", lines);
    }

    private static string BuildInvoiceBankDetailsHtml(IReadOnlyDictionary<string, string> settings)
    {
        var bankRows = new List<(string Label, string Value)>
        {
            ("Account Name", GetSetting(settings, "bankAccName")),
            ("Account Number", GetSetting(settings, "bankAccNo")),
            ("IFSC Code", GetSetting(settings, "bankIfsc")),
            ("Bank Name", GetSetting(settings, "bankName")),
            ("Bank Address", GetSetting(settings, "bankBranch")),
            ("SWIFT Code", GetSetting(settings, "bankSwift"))
        }
        .Where(item => !string.IsNullOrWhiteSpace(item.Value))
        .ToList();

        if (bankRows.Count == 0)
            return string.Empty;

        var rowsHtml = string.Join(string.Empty, bankRows.Select(item =>
            $"""
            <tr>
                <td style="padding:4px 0 4px 0;font-size:12px;color:#475569;vertical-align:top;width:150px;">{Encode(item.Label)}</td>
                <td style="padding:4px 0 4px 0;font-size:12px;color:#111827;vertical-align:top;">{Encode(item.Value)}</td>
            </tr>
            """));

        return $"""
            <div style="margin-top:18px;">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
                    {rowsHtml}
                </table>
            </div>
            """;
    }

    private static string GetSetting(IReadOnlyDictionary<string, string> settings, string key) =>
        settings.TryGetValue(key, out var value) ? value : string.Empty;

    private static string BuildOptionalTableRow(string label, string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return string.Empty;

        return $"""
            <tr>
                <td style="padding:14px 16px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:13px;font-weight:600;color:#475569;width:35%;vertical-align:top;text-align:left;">{Encode(label)}</td>
                <td style="padding:14px 16px;border-top:1px solid #e2e8f0;font-size:14px;color:#0f172a;width:65%;vertical-align:top;text-align:left;">{Encode(value)}</td>
            </tr>
            """;
    }

    private static string BuildLogoMarkup(Organization org, string? logoUrl, bool hasInlineLogo, string logoContentId)
    {
        if (hasInlineLogo)
        {
            return $"""
                <img src="cid:{logoContentId}" alt="{Encode(org.OrgName)} logo" width="84" height="84" style="display:block;width:84px;height:auto;max-width:84px;border:0;outline:none;text-decoration:none;" />
                """;
        }

        if (!string.IsNullOrWhiteSpace(logoUrl))
        {
            return $"""
                <img src="{Encode(logoUrl)}" alt="{Encode(org.OrgName)} logo" width="84" height="84" style="display:block;width:84px;height:auto;max-width:84px;border:0;outline:none;text-decoration:none;" />
                """;
        }

        return $"""
            <div style="width:72px;height:72px;border-radius:16px;background:#dcfce7;color:#059669;font-size:28px;font-weight:700;display:flex;align-items:center;justify-content:center;">
                {Encode(GetInitials(org.OrgName))}
            </div>
            """;
    }

    private static object[] BuildRecipients(string? emails) =>
        SplitEmails(emails)
            .Select(email => (object)new { emailAddress = new { address = email } })
            .ToArray();

    private static string[] SplitEmails(string? emails) =>
        string.IsNullOrWhiteSpace(emails)
            ? []
            : emails
                .Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(email => email.Trim())
                .Where(email => !string.IsNullOrWhiteSpace(email))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToArray();

    private async Task<EmailAttachment?> TryCreateInlineLogoAttachmentAsync(string? logoUrl, string contentId)
    {
        if (string.IsNullOrWhiteSpace(logoUrl))
            return null;

        try
        {
            using var client = _httpClientFactory.CreateClient();
            using var response = await client.GetAsync(logoUrl);
            if (!response.IsSuccessStatusCode)
                return null;

            var bytes = await response.Content.ReadAsByteArrayAsync();
            if (bytes.Length == 0)
                return null;

            var contentType = response.Content.Headers.ContentType?.MediaType;
            if (string.IsNullOrWhiteSpace(contentType))
                contentType = "image/png";

            var extension = GetImageExtension(contentType);
            return new EmailAttachment(
                $"org-logo{extension}",
                contentType,
                Convert.ToBase64String(bytes),
                contentId);
        }
        catch (Exception ex)
        {
            _log.LogWarning(ex, "Unable to load organization logo for email template.");
            return null;
        }
    }

    private static string GetImageExtension(string contentType) => contentType.ToLowerInvariant() switch
    {
        "image/jpeg" => ".jpg",
        "image/jpg" => ".jpg",
        "image/gif" => ".gif",
        "image/svg+xml" => ".svg",
        "image/webp" => ".webp",
        _ => ".png"
    };

    private sealed record EmailContent(string Subject, string HtmlBody, IReadOnlyList<EmailAttachment>? InlineAttachments = null);
    private sealed record EmailAttachment(string Name, string ContentType, string ContentBytes, string ContentId);
}