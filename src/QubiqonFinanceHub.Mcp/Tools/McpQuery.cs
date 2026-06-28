using System.Web;
using QubiqonFinanceHub.Mcp.Services;

namespace QubiqonFinanceHub.Mcp.Tools;

/// <summary>
/// Shared helpers for the read-only tool classes: building the standard
/// <c>FilterParams</c> query string and pretty-printing API responses.
/// </summary>
internal static class McpQuery
{
    /// <summary>
    /// Build the query string for endpoints backed by the API's FilterParams
    /// record (Page, PageSize, Status). Defaults page to 1 and pageSize to 20.
    /// </summary>
    public static string Query(string? status, int page, int pageSize)
    {
        var qs = HttpUtility.ParseQueryString(string.Empty);
        qs["page"] = (page <= 0 ? 1 : page).ToString();
        qs["pageSize"] = (pageSize <= 0 ? 20 : pageSize).ToString();
        if (!string.IsNullOrWhiteSpace(status)) qs["status"] = status;
        return "?" + qs;
    }

    /// <summary>Pretty-print a raw JSON payload before handing it to the model.</summary>
    public static string Result(string json) => FinanceApiClient.Pretty(json);
}
