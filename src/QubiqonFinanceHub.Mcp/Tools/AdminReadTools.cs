using System.ComponentModel;
using System.Web;
using ModelContextProtocol.Server;
using QubiqonFinanceHub.Mcp.Services;
using static QubiqonFinanceHub.Mcp.Tools.McpQuery;

namespace QubiqonFinanceHub.Mcp.Tools;

/// <summary>
/// Read-only admin/directory and tax-configuration tools. These hit role-gated
/// API endpoints (mostly Admin, some Finance/Admin), so they return 403 for
/// users without the required role — the API's existing authorization applies
/// unchanged. Read-only — no create/update/delete operations are exposed.
/// </summary>
[McpServerToolType]
public class AdminReadTools(FinanceApiClient api)
{
    // ─── employees ─────────────────────────────────────────────

    [McpServerTool(Name = "list_employees")]
    [Description("List employees in the organization. Requires Finance or Admin role; returns 403 otherwise.")]
    public async Task<string> ListEmployees(
        [Description("Optional status filter.")] string? status = null,
        [Description("Page number, 1-based. Default 1.")] int page = 1,
        [Description("Page size, default 20.")] int pageSize = 20,
        CancellationToken ct = default)
        => Result(await api.GetJsonAsync($"employees{Query(status, page, pageSize)}", ct));

    [McpServerTool(Name = "list_employee_roles")]
    [Description("List the available employee roles. Requires Finance or Admin role; returns 403 otherwise.")]
    public async Task<string> ListEmployeeRoles(CancellationToken ct)
        => Result(await api.GetJsonAsync("employees/roles", ct));

    [McpServerTool(Name = "get_employee")]
    [Description("Get a single employee by their GUID id. Requires Finance or Admin role; returns 403 otherwise.")]
    public async Task<string> GetEmployee(
        [Description("Employee id (GUID).")] Guid id,
        CancellationToken ct)
        => Result(await api.GetJsonAsync($"employees/{id}", ct));

    // ─── GST treatments ────────────────────────────────────────

    [McpServerTool(Name = "list_gst_treatments")]
    [Description("List GST treatments. Requires Admin role; returns 403 otherwise.")]
    public async Task<string> ListGstTreatments(
        [Description("Optional status filter.")] string? status = null,
        [Description("Page number, 1-based. Default 1.")] int page = 1,
        [Description("Page size, default 20.")] int pageSize = 20,
        CancellationToken ct = default)
        => Result(await api.GetJsonAsync($"gst-treatments{Query(status, page, pageSize)}", ct));

    [McpServerTool(Name = "get_gst_treatment")]
    [Description("Get a single GST treatment by its GUID id. Requires Admin role; returns 403 otherwise.")]
    public async Task<string> GetGstTreatment(
        [Description("GST treatment id (GUID).")] Guid id,
        CancellationToken ct)
        => Result(await api.GetJsonAsync($"gst-treatments/{id}", ct));

    // ─── tax config ────────────────────────────────────────────

    [McpServerTool(Name = "list_tax_configs")]
    [Description("List tax configurations, optionally filtered by type. Requires Admin role; returns 403 otherwise.")]
    public async Task<string> ListTaxConfigs(
        [Description("Optional tax config type filter.")] string? type = null,
        CancellationToken ct = default)
    {
        var path = "tax-config";
        if (!string.IsNullOrWhiteSpace(type))
        {
            var qs = HttpUtility.ParseQueryString(string.Empty);
            qs["type"] = type;
            path += "?" + qs;
        }
        return Result(await api.GetJsonAsync(path, ct));
    }

    [McpServerTool(Name = "get_tax_config")]
    [Description("Get a single tax configuration by its GUID id. Requires Admin role; returns 403 otherwise.")]
    public async Task<string> GetTaxConfig(
        [Description("Tax config id (GUID).")] Guid id,
        CancellationToken ct)
        => Result(await api.GetJsonAsync($"tax-config/{id}", ct));

    // ─── place of supply ───────────────────────────────────────

    [McpServerTool(Name = "list_places_of_supply")]
    [Description("List places of supply. Requires Admin role; returns 403 otherwise.")]
    public async Task<string> ListPlacesOfSupply(
        [Description("Optional status filter.")] string? status = null,
        [Description("Page number, 1-based. Default 1.")] int page = 1,
        [Description("Page size, default 20.")] int pageSize = 20,
        CancellationToken ct = default)
        => Result(await api.GetJsonAsync($"place-of-supply{Query(status, page, pageSize)}", ct));

    [McpServerTool(Name = "get_place_of_supply")]
    [Description("Get a single place of supply by its code. Requires Admin role; returns 403 otherwise.")]
    public async Task<string> GetPlaceOfSupply(
        [Description("Place of supply code.")] string code,
        CancellationToken ct)
        => Result(await api.GetJsonAsync($"place-of-supply/{Uri.EscapeDataString(code)}", ct));

    // ─── organizations ─────────────────────────────────────────

    [McpServerTool(Name = "list_organizations")]
    [Description("List all organizations. Requires Admin role; returns 403 otherwise.")]
    public async Task<string> ListOrganizations(CancellationToken ct)
        => Result(await api.GetJsonAsync("organization/all", ct));

    [McpServerTool(Name = "get_current_organization")]
    [Description("Get the current (effective) organization. Requires Admin role; returns 403 otherwise.")]
    public async Task<string> GetCurrentOrganization(CancellationToken ct)
        => Result(await api.GetJsonAsync("organization", ct));

    [McpServerTool(Name = "get_organization")]
    [Description("Get a single organization by its GUID id. Requires Admin role; returns 403 otherwise.")]
    public async Task<string> GetOrganization(
        [Description("Organization id (GUID).")] Guid id,
        CancellationToken ct)
        => Result(await api.GetJsonAsync($"organization/{id}", ct));

    [McpServerTool(Name = "get_organization_admin_settings")]
    [Description("Get the admin-level organization settings. Requires Admin role; returns 403 otherwise.")]
    public async Task<string> GetOrganizationAdminSettings(CancellationToken ct)
        => Result(await api.GetJsonAsync("organization/settings", ct));

    // ─── directory ─────────────────────────────────────────────

    [McpServerTool(Name = "list_graph_users")]
    [Description("List directory users from Microsoft Graph. Requires Admin role; returns 403 otherwise.")]
    public async Task<string> ListGraphUsers(CancellationToken ct)
        => Result(await api.GetJsonAsync("graph/users", ct));
}
