using QubiqonFinanceHub.API.Services.Interfaces;

namespace QubiqonFinanceHub.API.Services.Implementations;

public class EmailService : IEmailService
{
    private readonly ILogger<EmailService> _log;

    public EmailService(ILogger<EmailService> log)
    {
        _log = log;
    }

    public Task SendNotificationAsync(
        string templateKey,
        Dictionary<string, string> variables,
        string toEmail,
        string? ccEmails = null,
        string? attachmentPath = null)
    {
        // Stub: just log the email locally, no actual sending
        _log.LogInformation(
            "[EmailStub] Template: {Template} | To: {To} | Variables: {@Vars}",
            templateKey, toEmail, variables);

        return Task.CompletedTask;
    }
}