using Microsoft.EntityFrameworkCore;
using QubiqonFinanceHub.API.Data;
using QubiqonFinanceHub.API.DTOs;
using QubiqonFinanceHub.API.Models.Entities;
using QubiqonFinanceHub.API.Models.Enums;
using QubiqonFinanceHub.API.Services.Interfaces;

namespace QubiqonFinanceHub.API.Services.Implementations;

public class DashboardService : IDashboardService
{
    private const int TopReceivableClients = 8;
    private const int TopBillAccounts = 12;

    private readonly FinanceHubDbContext _db;
    private readonly ITenantService _tenant;
    private readonly IInvoiceService _invoices;
    private readonly ICurrencyRateService _currencyRates;

    public DashboardService(
        FinanceHubDbContext db,
        ITenantService tenant,
        IInvoiceService invoices,
        ICurrencyRateService currencyRates)
    {
        _db = db;
        _tenant = tenant;
        _invoices = invoices;
        _currencyRates = currencyRates;
    }

    public async Task<DashboardDto> GetStatsAsync(bool myOnly = false, string? reportCurrency = null)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var empId = _tenant.GetCurrentEmployeeId();

        var expenses = _db.ExpenseRequests.Where(e => e.OrganizationId == orgId);
        if (myOnly) expenses = expenses.Where(e => e.EmployeeId == empId);

        var advances = _db.AdvancePayments.Where(a => a.OrganizationId == orgId);
        if (myOnly) advances = advances.Where(a => a.EmployeeId == empId);

        var bills = _db.VendorBills.Where(b => b.OrganizationId == orgId);
        var invoices = _db.Invoices.Where(i => i.OrganizationId == orgId).AsNoTracking();

        var pendingExpenses = await expenses.CountAsync(e => e.Status == ExpenseStatus.PendingApproval);
        var approvedExpenses = await expenses.CountAsync(e =>
            e.Status == ExpenseStatus.Approved || e.Status == ExpenseStatus.AwaitingPayment);
        var completedExpenses = await expenses.CountAsync(e => e.Status == ExpenseStatus.Completed);

        var pendingBills = await bills.CountAsync(b => b.Status == BillStatus.Submitted);

        var billsToPayQuery = bills.AsNoTracking().Where(b => b.Status == BillStatus.Approved);
        var billsToPay = await billsToPayQuery.ToListAsync();
        var billsToPayCount = billsToPay.Count;
        var billsToPayAmount = billsToPay.Sum(b => b.TotalPayable);

        var pendingAdvances = await advances.CountAsync(a => a.Status == AdvanceStatus.Pending);
        var disbursedAdvances = await advances.CountAsync(a =>
            a.Status == AdvanceStatus.Disbursed
            || a.Status == AdvanceStatus.PartiallyDisbursed
            || a.Status == AdvanceStatus.Settled);

        var pendingApprovals = pendingExpenses + pendingBills + pendingAdvances;

        var invoiceCounts = await _invoices.GetStatusCountsAsync();

        var (usdRates, availableCurrencies) = await _currencyRates.LoadUsdReportingRatesAsync();

        var invoiceRowsRaw = await invoices
            .Where(i =>
                i.Status != InvoiceStatus.Paid
                && i.Status != InvoiceStatus.Draft
                && i.paidAmound < i.Total)
            .Select(i => new { i.ClientId, ClientName = i.Client.Name, i.Currency, Outstanding = i.Total - i.paidAmound })
            .ToListAsync();

        var invoiceRows = invoiceRowsRaw
            .Select(r => new ReceivableRow(r.ClientId, r.ClientName, r.Currency, r.Outstanding))
            .ToList();

        var reportCode = NormalizeReportCurrency(reportCurrency);
        var displayCurrency = reportCode;

        IReadOnlyList<DashboardSliceDto> receivablesByClient;
        decimal receivableOutstanding;

        if (!string.IsNullOrEmpty(reportCode))
        {
            receivablesByClient = BuildReceivablesInReportCurrency(invoiceRows, reportCode, usdRates);
            receivableOutstanding = receivablesByClient.Sum(s => s.Value);
        }
        else
        {
            receivableOutstanding = invoiceRows.Sum(r => r.Outstanding);
            receivablesByClient = invoiceRows
                .GroupBy(r => (r.ClientId, r.ClientName, r.Currency))
                .Select(g => new DashboardSliceDto(g.Key.ClientName, g.Sum(x => x.Outstanding), g.Key.Currency))
                .OrderByDescending(x => x.Value)
                .Take(TopReceivableClients)
                .ToList();
        }

        var approvedBillIds = billsToPay.Select(b => b.Id).ToList();
        var billsToPayByAccount = await BuildBillsToPayByAccountAsync(approvedBillIds, billsToPay);

        return new DashboardDto(
            pendingExpenses,
            approvedExpenses,
            completedExpenses,
            pendingBills,
            billsToPayCount,
            billsToPayAmount,
            pendingAdvances,
            disbursedAdvances,
            pendingApprovals,
            receivableOutstanding,
            receivableOutstanding,
            invoiceCounts,
            receivablesByClient,
            billsToPayByAccount,
            availableCurrencies,
            displayCurrency);
    }

    private List<DashboardSliceDto> BuildReceivablesInReportCurrency(
        List<ReceivableRow> invoiceRows,
        string reportCode,
        IReadOnlyDictionary<string, decimal> usdRates)
    {
        var byClient = new Dictionary<Guid, (string Name, decimal Total)>();

        foreach (var row in invoiceRows)
        {
            var source = (row.Currency ?? "").Trim().ToUpperInvariant();
            if (source.Length != 3) source = reportCode;

            var converted = _currencyRates.TryConvert(row.Outstanding, source, reportCode, usdRates);
            if (converted == null) continue;

            if (byClient.TryGetValue(row.ClientId, out var existing))
                byClient[row.ClientId] = (existing.Name, existing.Total + converted.Value);
            else
                byClient[row.ClientId] = (row.ClientName, converted.Value);
        }

        return byClient
            .Select(kv => new DashboardSliceDto(kv.Value.Name, kv.Value.Total, reportCode))
            .Where(s => s.Value > 0)
            .OrderByDescending(s => s.Value)
            .Take(TopReceivableClients)
            .ToList();
    }

    private static string? NormalizeReportCurrency(string? code)
    {
        if (string.IsNullOrWhiteSpace(code)) return null;
        var n = code.Trim().ToUpperInvariant();
        return n.Length == 3 ? n : null;
    }

    private async Task<IReadOnlyList<DashboardSliceDto>> BuildBillsToPayByAccountAsync(
        IReadOnlyList<Guid> approvedBillIds,
        IReadOnlyList<VendorBill> billsToPay)
    {
        if (approvedBillIds.Count == 0)
            return Array.Empty<DashboardSliceDto>();

        var lines = await _db.VendorBillLineItems
            .AsNoTracking()
            .Where(li => approvedBillIds.Contains(li.VendorBillId))
            .Select(li => new { li.VendorBillId, li.Account, li.Amount })
            .ToListAsync();

        var buckets = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase);

        foreach (var group in lines.GroupBy(x => string.IsNullOrWhiteSpace(x.Account) ? "Other" : x.Account!.Trim()))
            buckets[group.Key] = group.Sum(x => x.Amount);

        var billsWithLines = lines.Select(l => l.VendorBillId).Distinct().ToHashSet();
        foreach (var b in billsToPay)
        {
            if (billsWithLines.Contains(b.Id)) continue;
            const string uncategorized = "Uncategorized";
            buckets.TryGetValue(uncategorized, out var v);
            buckets[uncategorized] = v + b.TotalPayable;
        }

        return buckets
            .OrderByDescending(kv => kv.Value)
            .Take(TopBillAccounts)
            .Select(kv => new DashboardSliceDto(kv.Key, kv.Value, null))
            .ToList();
    }

    private sealed record ReceivableRow(Guid ClientId, string ClientName, string Currency, decimal Outstanding);
}
