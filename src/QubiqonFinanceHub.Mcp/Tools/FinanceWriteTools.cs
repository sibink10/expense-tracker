using System.ComponentModel;
using ModelContextProtocol.Server;
using QubiqonFinanceHub.Mcp.Services;
using static QubiqonFinanceHub.Mcp.Tools.McpQuery;

namespace QubiqonFinanceHub.Mcp.Tools;

/// <summary>
/// Write Finance Hub tools. Every call runs as the signed-in user via the Finance
/// app JWT, so the API's existing role + multi-tenant checks apply unchanged.
/// </summary>
[McpServerToolType]
public class FinanceWriteTools(FinanceApiClient api)
{
    [McpServerTool(Name = "create_advance")]
    [Description("Create a new advance request for the current user. The amount must be within the " +
        "organization's monthly balance cap, which the server enforces — if it is exceeded the call " +
        "returns an error stating the available balance. Returns the created advance.")]
    public async Task<string> CreateAdvance(
        [Description("Advance amount requested, in INR. Must be greater than zero.")] decimal amount,
        [Description("Reason/purpose for the advance.")] string purpose,
        CancellationToken ct = default)
        => Result(await api.PostJsonAsync("advances", new { amount, purpose }, ct));

    [McpServerTool(Name = "create_forecast")]
    [Description("Create a new spending forecast for the current user. A forecast is submitted for " +
        "approval; once approved it can be linked to expenses. There is no amount cap. Supporting " +
        "documents cannot be attached through this tool. Returns the created forecast.")]
    public async Task<string> CreateForecast(
        [Description("Short title for the forecast.")] string title,
        [Description("Reason/purpose for the forecast.")] string purpose,
        [Description("Expected amount, in INR. Must be greater than zero.")] decimal expectedAmount,
        [Description("Expected expense date, in YYYY-MM-DD format.")] string expectedExpenseDate,
        [Description("Optional longer description.")] string? description = null,
        [Description("Optional notes.")] string? notes = null,
        CancellationToken ct = default)
        => Result(await api.PostFormAsync("forecasts", new Dictionary<string, string?>
        {
            ["title"] = title,
            ["purpose"] = purpose,
            ["expectedAmount"] = expectedAmount.ToString(System.Globalization.CultureInfo.InvariantCulture),
            ["expectedExpenseDate"] = expectedExpenseDate,
            ["description"] = description,
            ["notes"] = notes,
        }, ct));

    [McpServerTool(Name = "create_expense")]
    [Description("Create an expense request for the current user. An expense is EITHER linked to an " +
        "approved forecast OR submitted ad-hoc. You MUST decide which via the required filingMode " +
        "parameter — never assume. To help the user choose, first call list_approved_forecasts: if " +
        "approved forecasts exist, show them and ask which to link (filingMode=forecast + that " +
        "forecastId); if none exist, tell the user they can create one first (create_forecast) or " +
        "submit ad-hoc (filingMode=adhoc). Bill images cannot be attached here. Returns the created expense.")]
    public async Task<string> CreateExpense(
        [Description("Expense amount, in INR. Must be greater than zero.")] decimal amount,
        [Description("Reason/purpose for the expense.")] string purpose,
        [Description("Date on the bill, in YYYY-MM-DD format.")] string billDate,
        [Description("Required. \"forecast\" to link this expense to an approved forecast (forecastId then required), " +
            "or \"adhoc\" to submit with no forecast. Ask the user which they want — do not assume.")] string filingMode,
        [Description("The APPROVED forecast id to link to. Required when filingMode is \"forecast\"; ignored for \"adhoc\".")] string? forecastId = null,
        CancellationToken ct = default)
    {
        var mode = filingMode?.Trim().ToLowerInvariant();
        switch (mode)
        {
            case "forecast" when string.IsNullOrWhiteSpace(forecastId):
                throw new InvalidOperationException(
                    "filingMode is \"forecast\" but no forecastId was provided. Call list_approved_forecasts, " +
                    "ask the user which approved forecast to link, and pass its id as forecastId — or submit ad-hoc with filingMode=\"adhoc\".");
            case "forecast":
                break;
            case "adhoc":
                forecastId = null;
                break;
            default:
                throw new InvalidOperationException(
                    "filingMode must be \"forecast\" (link to an approved forecast) or \"adhoc\" (no forecast). Ask the user which they want.");
        }

        return Result(await api.PostFormAsync("expenses", new Dictionary<string, string?>
        {
            ["amount"] = amount.ToString(System.Globalization.CultureInfo.InvariantCulture),
            ["purpose"] = purpose,
            ["billDate"] = billDate,
            ["forecastId"] = forecastId,
        }, ct));
    }
}
