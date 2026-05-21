namespace QubiqonFinanceHub.API.Models.Zoho;

public class ZohoSignRequestsListQueryDto
{
    public int RowCount { get; set; } = 10;
    public int StartIndex { get; set; } = 1;
    public string? TemplateName { get; set; }
    public string SortColumn { get; set; } = "created_time";
    public string SortOrder { get; set; } = "DESC";
}
