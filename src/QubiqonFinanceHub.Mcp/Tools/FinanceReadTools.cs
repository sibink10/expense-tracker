using System.ComponentModel;
using System.Web;
using ModelContextProtocol.Server;
using QubiqonFinanceHub.Mcp.Services;
using static QubiqonFinanceHub.Mcp.Tools.McpQuery;

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
        [Description("Optional status filter.")] string? status = null,
        [Description("Page number, 1-based. Default 1.")] int page = 1,
        [Description("Page size, default 20.")] int pageSize = 20,
        CancellationToken ct = default)
        => Result(await api.GetJsonAsync($"expenses/my{Query(status, page, pageSize)}", ct));

    [McpServerTool(Name = "list_all_expenses")]
    [Description("List all expense requests across the organization. Requires Approver, Finance, or Admin role; returns 403 otherwise.")]
    public async Task<string> ListAllExpenses(
        [Description("Optional status filter.")] string? status = null,
        [Description("Page number, 1-based. Default 1.")] int page = 1,
        [Description("Page size, default 20.")] int pageSize = 20,
        CancellationToken ct = default)
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
        [Description("Optional status filter.")] string? status = null,
        [Description("Page number, 1-based. Default 1.")] int page = 1,
        [Description("Page size, default 20.")] int pageSize = 20,
        CancellationToken ct = default)
        => Result(await api.GetJsonAsync($"advances/my{Query(status, page, pageSize)}", ct));

    [McpServerTool(Name = "list_vendor_bills")]
    [Description("List vendor bills across the organization. Requires Approver, Finance, or Admin role. Optional status filter.")]
    public async Task<string> ListVendorBills(
        [Description("Optional status filter.")] string? status = null,
        [Description("Page number, 1-based. Default 1.")] int page = 1,
        [Description("Page size, default 20.")] int pageSize = 20,
        CancellationToken ct = default)
        => Result(await api.GetJsonAsync($"bills{Query(status, page, pageSize)}", ct));

    [McpServerTool(Name = "list_invoices")]
    [Description("List client invoices. Requires Approver, Finance, or Admin role. Optional status filter.")]
    public async Task<string> ListInvoices(
        [Description("Optional status filter.")] string? status = null,
        [Description("Page number, 1-based. Default 1.")] int page = 1,
        [Description("Page size, default 20.")] int pageSize = 20,
        CancellationToken ct = default)
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
        [Description("Scope stats to the current user only. Default false.")] bool myOnly = false,
        [Description("Optional ISO currency code to convert totals into (e.g. INR, USD).")] string? reportCurrency = null,
        CancellationToken ct = default)
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

    // ─── advances ──────────────────────────────────────────────

    [McpServerTool(Name = "get_advance")]
    [Description("Get a single advance payment request by its GUID id.")]
    public async Task<string> GetAdvance(
        [Description("Advance request id (GUID).")] Guid id,
        CancellationToken ct)
        => Result(await api.GetJsonAsync($"advances/{id}", ct));

    [McpServerTool(Name = "list_all_advances")]
    [Description("List all advance requests across the organization. Requires Approver, Finance, or Admin role; returns 403 otherwise.")]
    public async Task<string> ListAllAdvances(
        [Description("Optional status filter.")] string? status = null,
        [Description("Page number, 1-based. Default 1.")] int page = 1,
        [Description("Page size, default 20.")] int pageSize = 20,
        CancellationToken ct = default)
        => Result(await api.GetJsonAsync($"advances{Query(status, page, pageSize)}", ct));

    [McpServerTool(Name = "get_employee_advance_history")]
    [Description("Get the advance history for a specific employee by their GUID id.")]
    public async Task<string> GetEmployeeAdvanceHistory(
        [Description("Employee id (GUID).")] Guid empId,
        CancellationToken ct)
        => Result(await api.GetJsonAsync($"advances/employee/{empId}/history", ct));

    // ─── vendor bills ──────────────────────────────────────────

    [McpServerTool(Name = "get_bill")]
    [Description("Get a single vendor bill by its GUID id.")]
    public async Task<string> GetBill(
        [Description("Vendor bill id (GUID).")] Guid id,
        CancellationToken ct)
        => Result(await api.GetJsonAsync($"bills/{id}", ct));

    [McpServerTool(Name = "get_bill_attachment_url")]
    [Description("Get the download URL for a vendor bill's attachment by the bill's GUID id.")]
    public async Task<string> GetBillAttachmentUrl(
        [Description("Vendor bill id (GUID).")] Guid id,
        CancellationToken ct)
        => Result(await api.GetJsonAsync($"bills/{id}/attachment", ct));

    // ─── vendors & clients (single) ────────────────────────────

    [McpServerTool(Name = "get_vendor")]
    [Description("Get a single vendor by its GUID id.")]
    public async Task<string> GetVendor(
        [Description("Vendor id (GUID).")] Guid id,
        CancellationToken ct)
        => Result(await api.GetJsonAsync($"vendors/{id}", ct));

    [McpServerTool(Name = "get_client")]
    [Description("Get a single client by its GUID id.")]
    public async Task<string> GetClient(
        [Description("Client id (GUID).")] Guid id,
        CancellationToken ct)
        => Result(await api.GetJsonAsync($"clients/{id}", ct));

    [McpServerTool(Name = "get_client_form_options")]
    [Description("Get reference/dropdown options used when creating or editing a client (countries, currencies, tax types, etc.).")]
    public async Task<string> GetClientFormOptions(CancellationToken ct)
        => Result(await api.GetJsonAsync("clients/form-options", ct));

    // ─── invoices ──────────────────────────────────────────────

    [McpServerTool(Name = "list_invoice_counts")]
    [Description("Get invoice counts grouped by status. Requires Approver, Finance, or Admin role; returns 403 otherwise.")]
    public async Task<string> ListInvoiceCounts(CancellationToken ct)
        => Result(await api.GetJsonAsync("invoices/counts", ct));

    [McpServerTool(Name = "get_invoice_signed_pdf_url")]
    [Description("Get the download URL for an invoice's Zoho-signed PDF by the invoice's GUID id.")]
    public async Task<string> GetInvoiceSignedPdfUrl(
        [Description("Invoice id (GUID).")] Guid id,
        CancellationToken ct)
        => Result(await api.GetJsonAsync($"invoices/{id}/signed-pdf", ct));

    [McpServerTool(Name = "get_invoice_sign_status")]
    [Description("Get the Zoho Sign signature status for an invoice. Set refresh=true to re-poll Zoho for the latest status.")]
    public async Task<string> GetInvoiceSignStatus(
        [Description("Invoice id (GUID).")] Guid id,
        [Description("Re-poll Zoho for live status. Default false.")] bool refresh = false,
        CancellationToken ct = default)
    {
        var qs = HttpUtility.ParseQueryString(string.Empty);
        qs["refresh"] = refresh ? "true" : "false";
        return Result(await api.GetJsonAsync($"invoices/{id}/zoho-sign/status?{qs}", ct));
    }

    // ─── expenses ──────────────────────────────────────────────

    [McpServerTool(Name = "get_expense_bill_url")]
    [Description("Get the download URL for an expense's bill/receipt by the expense's GUID id.")]
    public async Task<string> GetExpenseBillUrl(
        [Description("Expense request id (GUID).")] Guid id,
        CancellationToken ct)
        => Result(await api.GetJsonAsync($"expenses/{id}/bill", ct));

    // ─── forecasts ─────────────────────────────────────────────

    [McpServerTool(Name = "list_forecasts")]
    [Description("List forecasts across the organization. Optional status filter.")]
    public async Task<string> ListForecasts(
        [Description("Optional status filter.")] string? status = null,
        [Description("Page number, 1-based. Default 1.")] int page = 1,
        [Description("Page size, default 20.")] int pageSize = 20,
        CancellationToken ct = default)
        => Result(await api.GetJsonAsync($"forecasts{Query(status, page, pageSize)}", ct));

    [McpServerTool(Name = "list_my_forecasts")]
    [Description("List the current user's own forecasts. Optional status filter.")]
    public async Task<string> ListMyForecasts(
        [Description("Optional status filter.")] string? status = null,
        [Description("Page number, 1-based. Default 1.")] int page = 1,
        [Description("Page size, default 20.")] int pageSize = 20,
        CancellationToken ct = default)
        => Result(await api.GetJsonAsync($"forecasts/my{Query(status, page, pageSize)}", ct));

    [McpServerTool(Name = "list_approved_forecasts")]
    [Description("List all approved forecasts.")]
    public async Task<string> ListApprovedForecasts(CancellationToken ct)
        => Result(await api.GetJsonAsync("forecasts/approved", ct));

    [McpServerTool(Name = "get_forecast")]
    [Description("Get a single forecast by its GUID id.")]
    public async Task<string> GetForecast(
        [Description("Forecast id (GUID).")] Guid id,
        CancellationToken ct)
        => Result(await api.GetJsonAsync($"forecasts/{id}", ct));
}
