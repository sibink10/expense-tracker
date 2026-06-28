using System.ComponentModel;
using ModelContextProtocol.Server;
using QubiqonFinanceHub.Mcp.Services;
using static QubiqonFinanceHub.Mcp.Tools.McpQuery;

namespace QubiqonFinanceHub.Mcp.Tools;

/// <summary>
/// Read-only reference/settings tools usable by any authorized user. Like the
/// other tool classes, every call runs as the signed-in user via the Finance
/// app JWT, so results respect the user's role and organization. Read-only —
/// no create/update/delete operations are exposed.
/// </summary>
[McpServerToolType]
public class ReferenceReadTools(FinanceApiClient api)
{
    [McpServerTool(Name = "get_current_user")]
    [Description("Get the current authenticated user's Finance profile, including roles and organization context.")]
    public async Task<string> GetCurrentUser(CancellationToken ct)
        => Result(await api.GetJsonAsync("auth/me", ct));

    // ─── categories ────────────────────────────────────────────

    [McpServerTool(Name = "list_categories")]
    [Description("List all expense/bill categories for the organization.")]
    public async Task<string> ListCategories(CancellationToken ct)
        => Result(await api.GetJsonAsync("categories", ct));

    [McpServerTool(Name = "get_category")]
    [Description("Get a single category by its GUID id.")]
    public async Task<string> GetCategory(
        [Description("Category id (GUID).")] Guid id,
        CancellationToken ct)
        => Result(await api.GetJsonAsync($"categories/{id}", ct));

    // ─── accounts ──────────────────────────────────────────────

    [McpServerTool(Name = "list_accounts")]
    [Description("List all accounts (chart of accounts) for the organization.")]
    public async Task<string> ListAccounts(CancellationToken ct)
        => Result(await api.GetJsonAsync("accounts", ct));

    [McpServerTool(Name = "get_account")]
    [Description("Get a single account by its GUID id.")]
    public async Task<string> GetAccount(
        [Description("Account id (GUID).")] Guid id,
        CancellationToken ct)
        => Result(await api.GetJsonAsync($"accounts/{id}", ct));

    // ─── payment terms ─────────────────────────────────────────

    [McpServerTool(Name = "list_payment_terms")]
    [Description("List payment terms for the organization. Optional status filter.")]
    public async Task<string> ListPaymentTerms(
        [Description("Optional status filter.")] string? status = null,
        [Description("Page number, 1-based. Default 1.")] int page = 1,
        [Description("Page size, default 20.")] int pageSize = 20,
        CancellationToken ct = default)
        => Result(await api.GetJsonAsync($"payment-terms{Query(status, page, pageSize)}", ct));

    [McpServerTool(Name = "get_payment_term")]
    [Description("Get a single payment term by its GUID id.")]
    public async Task<string> GetPaymentTerm(
        [Description("Payment term id (GUID).")] Guid id,
        CancellationToken ct)
        => Result(await api.GetJsonAsync($"payment-terms/{id}", ct));

    // ─── organization settings ─────────────────────────────────

    [McpServerTool(Name = "get_organization_settings")]
    [Description("Get the current user's organization settings (key/value configuration).")]
    public async Task<string> GetOrganizationSettings(CancellationToken ct)
        => Result(await api.GetJsonAsync("settings/organization", ct));
}
