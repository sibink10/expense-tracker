namespace QubiqonFinanceHub.API.Services;

public class EmailOptions
{
    public const string SectionName = "Email";

    public string FromEmail { get; set; } = string.Empty;
    public string FromName { get; set; } = string.Empty;
    public string RequestNotificationTo { get; set; } = string.Empty;
}
