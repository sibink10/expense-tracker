namespace QubiqonFinanceHub.API.Models.Zoho;

public class ZohoSignSendRequestDto
{
    public ZohoSignDocumentType Type { get; set; }
    public Guid SourceId { get; set; }
    public string? TemplateId { get; set; }
    public string? Notes { get; set; }
}
