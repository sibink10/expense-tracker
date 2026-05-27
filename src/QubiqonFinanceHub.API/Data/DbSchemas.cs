namespace QubiqonFinanceHub.API.Data;

/// <summary>
/// SQL Server schema names. dbo = Organizations, OrganizationSettings, Employees, EmailTemplates.
/// finance = all other finance-domain tables.
/// </summary>
public static class DbSchemas
{
    public const string Dbo = "dbo";
    public const string Finance = "finance";
    public const string Project_Management = "pm";
    public const string Qhrms = "qhrms";
    public const string Qscms = "qscms";
}
