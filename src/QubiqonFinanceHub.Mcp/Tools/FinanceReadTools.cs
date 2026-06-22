using System.ComponentModel;
using System.Web;
using ModelContextProtocol.Server;
using QubiqonFinanceHub.Mcp.Services;

namespace QubiqonFinanceHub.Mcp.Tools;

/// <summary>
/// Read-only Finance Hub tools. Every call runs as the signed-in user via the
/// Finance app JWT, so results are automatically scoped to that user's role and
/// organization. No write/approve/pay operations are exposed.
/// </summary>
[McpServerToolType]
public class FinanceReadTools(FinanceApiClient api)
{
    [McpServerTool(Name = "list_my_expenses")]
    [Description("List the current user's own expense requests. Optionally filter by status (e.g. Pending, Approved, Rejected, Paid).")]
    public async Task<string> ListMyExpenses(
        [Description("Optional status filter.")] string? status,
        [Description("Page number, 1-based. Default 1.")] int page,
        [Description("Page size, default 20.")] int pageSize,
        CancellationToken ct)
        => Result(await api.GetJsonAsync($"expenses/my{Query(status, page, pageSize)}", ct));

    [McpServerTool(Name = "list_all_expenses")]
    [Description("List all expense requests across the organization. Requires Approver, Finance, or Admin role; returns 403 otherwise.")]
    public async Task<string> ListAllExpenses(
        [Description("Optional status filter.")] string? status,
        [Description("Page number, 1-based. Default 1.")] int page,
        [Description("Page size, default 20.")] int pageSize,
        CancellationToken ct)
        => Result(await api.GetJsonAsync($"expenses{Query(status, page, pageSize)}", ct));

    [McpServerTool(Name = "get_expense")]
    [Description("Get a single expense request by its GUID id.")]
    public async Task<string> GetExpense(
        [Description("Expense request id (GUID).")] Guid id,
        CancellationToken ct)
        => Result(await api.GetJsonAsync($"expenses/{id}", ct));

    [McpServerTool(Name = "list_my_advances")]
    [Description("List the current user's own advance payment requests. Optional status filter.")]
    public async Task<string> ListMyAdvances(
        [Description("Optional status filter.")] string? status,
        [Description("Page number, 1-based. Default 1.")] int page,
        [Description("Page size, default 20.")] int pageSize,
        CancellationToken ct)
        => Result(await api.GetJsonAsync($"advances/my{Query(status, page, pageSize)}", ct));

    [McpServerTool(Name = "list_vendor_bills")]
    [Description("List vendor bills across the organization. Requires Approver, Finance, or Admin role. Optional status filter.")]
    public async Task<string> ListVendorBills(
        [Description("Optional status filter.")] string? status,
        [Description("Page number, 1-based. Default 1.")] int page,
        [Description("Page size, default 20.")] int pageSize,
        CancellationToken ct)
        => Result(await api.GetJsonAsync($"bills{Query(status, page, pageSize)}", ct));

    [McpServerTool(Name = "list_invoices")]
    [Description("List client invoices. Requires Approver, Finance, or Admin role. Optional status filter.")]
    public async Task<string> ListInvoices(
        [Description("Optional status filter.")] string? status,
        [Description("Page number, 1-based. Default 1.")] int page,
        [Description("Page size, default 20.")] int pageSize,
        CancellationToken ct)
        => Result(await api.GetJsonAsync($"invoices{Query(status, page, pageSize)}", ct));

    [McpServerTool(Name = "get_invoice")]
    [Description("Get a single client invoice by its GUID id, including line items, GST and TDS.")]
    public async Task<string> GetInvoice(
        [Description("Invoice id (GUID).")] Guid id,
        CancellationToken ct)
        => Result(await api.GetJsonAsync($"invoices/{id}", ct));

    [McpServerTool(Name = "dashboard_summary")]
    [Description("Get aggregate finance dashboard stats for the user's organization. Set myOnly=true to scope to the current user's own items.")]
    public async Task<string> DashboardSummary(
        [Description("Scope stats to the current user only. Default false.")] bool myOnly,
        [Description("Optional ISO currency code to convert totals into (e.g. INR, USD).")] string? reportCurrency,
        CancellationToken ct)
    {
        var qs = HttpUtility.ParseQueryString(string.Empty);
        qs["myOnly"] = myOnly ? "true" : "false";
        if (!string.IsNullOrWhiteSpace(reportCurrency)) qs["reportCurrency"] = reportCurrency;
        return Result(await api.GetJsonAsync($"dashboard?{qs}", ct));
    }

    [McpServerTool(Name = "list_vendors")]
    [Description("List vendors (name, GSTIN, email) so a vendor name can be resolved to its id.")]
    public async Task<string> ListVendors(CancellationToken ct)
        => Result(await api.GetJsonAsync("vendors", ct));

    [McpServerTool(Name = "list_clients")]
    [Description("List clients (name, country, currency, tax type) so a client name can be resolved to its id.")]
    public async Task<string> ListClients(CancellationToken ct)
        => Result(await api.GetJsonAsync("clients", ct));

    // ─── helpers ───────────────────────────────────────────────
    // Matches the API's FilterParams record (Page, PageSize, Status, ...).
    private static string Query(string? status, int page, int pageSize)
    {
        var qs = HttpUtility.ParseQueryString(string.Empty);
        qs["page"] = (page <= 0 ? 1 : page).ToString();
        qs["pageSize"] = (pageSize <= 0 ? 20 : pageSize).ToString();
        if (!string.IsNullOrWhiteSpace(status)) qs["status"] = status;
        return "?" + qs;
    }

    private static string Result(string json) => FinanceApiClient.Pretty(json);
}
