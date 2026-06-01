using Microsoft.EntityFrameworkCore;
using QubiqonFinanceHub.API.Data;
using QubiqonFinanceHub.API.DTOs;
using QubiqonFinanceHub.API.Models.Entities;
using QubiqonFinanceHub.API.Models.Enums;
using QubiqonFinanceHub.API.Services.Helpers;
using QubiqonFinanceHub.API.Services.Interfaces;

namespace QubiqonFinanceHub.API.Services.Implementations;

public class DashboardService : IDashboardService
{
    private const int TopReceivableClients = 8;
    private const string DefaultReportCurrency = "INR";

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
        var todayUtc = DateTime.UtcNow.Date;

        var expenses = _db.ExpenseRequests.Where(e => e.OrganizationId == orgId);
        if (myOnly) expenses = expenses.Where(e => e.EmployeeId == empId);

        var advances = _db.AdvancePayments.Where(a => a.OrganizationId == orgId);
        if (myOnly) advances = advances.Where(a => a.EmployeeId == empId);

        var bills = _db.VendorBills.Where(b => b.OrganizationId == orgId).AsNoTracking();
        var invoices = _db.Invoices.Where(i => i.OrganizationId == orgId).AsNoTracking();

        var pendingSubmittedBills = await bills.CountAsync(b => b.Status == BillStatus.Submitted);

        // Pending approvals: expense + advance only (not vendor bills).
        var pendingExpenseApprovals =
            await expenses.CountAsync(e =>
                e.Status == ExpenseStatus.PendingApproval ||
                e.Status == ExpenseStatus.AwaitingBill ||
                e.Status == ExpenseStatus.PendingBillApproval);
        var pendingAdvanceOnly = await advances.CountAsync(a => a.Status == AdvanceStatus.Pending);
        var pendingApprovals = pendingExpenseApprovals + pendingAdvanceOnly;

        var expenseSlices = await BuildExpenseSlicesAsync(expenses);
        var advanceSlices = await BuildAdvanceSlicesAsync(advances);

        var (billsPayableSlices, billsToPayCount, billsToPayAmount) = BuildBillsPayableAggregates(await bills.ToListAsync(), todayUtc);

        var invoiceCounts = await _invoices.GetStatusCountsAsync();

        var (usdRates, availableCurrencies) = await _currencyRates.LoadUsdReportingRatesAsync();
        var reportCode = ResolveReportCurrency(reportCurrency, availableCurrencies);

        var receivableBuckets = await LoadReceivableCurrencyBucketsAsync(invoices);

        var (receivableOutstanding, receivablesByClient) =
            BuildReceivablesInReportCurrency(receivableBuckets, reportCode, usdRates);

        return new DashboardDto(
            pendingSubmittedBills,
            billsToPayCount,
            billsToPayAmount,
            receivableOutstanding,
            receivableOutstanding,
            invoiceCounts,
            pendingApprovals,
            expenseSlices,
            advanceSlices,
            billsPayableSlices,
            receivablesByClient,
            availableCurrencies,
            reportCode);
    }

    /// <summary>
    /// Payable rows with open balance (excludes draft/rejected/paid), same basis as /api/bills display.
    /// </summary>
    private static bool VendorBillEligibleForBillsToPay(VendorBill b) =>
        b.Status != BillStatus.Paid
        && b.Status != BillStatus.Rejected
        && b.Status != BillStatus.Draft
        && b.PaidAmount < b.TotalPayable;

    /// <summary>
    /// Buckets: Approved, Partially paid, and Overdue. Overdue = <see cref="VendorBillStatusRules.IsComputationallyOverdue"/>
    /// (Approved or PartiallyPaid + past due + open balance; same as bills list Overdue filter and BillDto display).
    /// </summary>
    private static (
        List<DashboardSliceDto> slices,
        int count,
        decimal amountSum) BuildBillsPayableAggregates(IReadOnlyList<VendorBill> billsList, DateTime utcTodayDate)
    {
        var approved = 0;
        var partial = 0;
        var overdue = 0;
        decimal balSum = 0;

        foreach (var b in billsList)
        {
            if (!VendorBillEligibleForBillsToPay(b)) continue;

            var bal = b.TotalPayable - b.PaidAmount;

            if (VendorBillStatusRules.IsComputationallyOverdue(b, utcTodayDate))
            {
                overdue++;
                balSum += bal;
                continue;
            }

            if (b.Status != BillStatus.Approved && b.Status != BillStatus.PartiallyPaid) continue;

            balSum += bal;
            if (b.Status == BillStatus.PartiallyPaid) partial++;
            else approved++;
        }

        var slices = new List<DashboardSliceDto>
        {
            new("Approved", approved, null),
            new("Partially paid", partial, null),
            new("Overdue", overdue, null),
        };
        var countSum = approved + partial + overdue;
        return (slices, countSum, balSum);
    }

    private static async Task<List<DashboardSliceDto>> BuildExpenseSlicesAsync(IQueryable<ExpenseRequest> expenses)
    {
        async Task<int> C(ExpenseStatus st) =>
            await expenses.CountAsync(e => e.Status == st);

        async Task<int> Cs(params ExpenseStatus[] sts) =>
            await expenses.CountAsync(e => sts.Contains(e.Status));

        var pending = await Cs(
            ExpenseStatus.PendingApproval,
            ExpenseStatus.AwaitingBill,
            ExpenseStatus.PendingBillApproval);

        var approved = await C(ExpenseStatus.Approved);
        var awaitingPayment = await C(ExpenseStatus.AwaitingPayment);
        var completed = await C(ExpenseStatus.Completed);
        var rejected = await C(ExpenseStatus.Rejected);
        var partiallyPaid = await C(ExpenseStatus.PartiallyPaid);
        var cancelled = await C(ExpenseStatus.Cancelled);

        return
        [
            new("Pending", pending, null),
            new("Approved", approved, null),
            new("Awaiting payment", awaitingPayment, null),
            new("Partially paid", partiallyPaid, null),
            new("Completed", completed, null),
            new("Cancelled", cancelled, null),
            new("Rejected", rejected, null),
        ];
    }

    private static async Task<List<DashboardSliceDto>> BuildAdvanceSlicesAsync(IQueryable<AdvancePayment> advances)
    {
        var pending = await advances.CountAsync(a => a.Status == AdvanceStatus.Pending);
        var approved = await advances.CountAsync(a => a.Status == AdvanceStatus.Approved);
        var rejected = await advances.CountAsync(a => a.Status == AdvanceStatus.Rejected);
        var partiallyDisbursed = await advances.CountAsync(a => a.Status == AdvanceStatus.PartiallyDisbursed);
        var disbursed = await advances.CountAsync(a => a.Status == AdvanceStatus.Disbursed);

        return
        [
            new("Pending", pending, null),
            new("Approved", approved, null),
            new("Disbursed", disbursed, null),
            new("Rejected", rejected, null),
            new("Partially paid", partiallyDisbursed, null),
        ];
    }



    /// <summary>
    /// One row per (client, native currency) with summed open balance — minimizes rows and FX calls for large invoice sets.
    /// </summary>
    private static async Task<List<ReceivableCurrencyBucket>> LoadReceivableCurrencyBucketsAsync(
        IQueryable<Invoice> invoices) =>
        await invoices
            .Where(i =>
                i.paidAmound < i.Total
                && (i.Status == InvoiceStatus.Sent || i.Status == InvoiceStatus.PartiallyPaid))
            .GroupBy(i => new { i.ClientId, i.Currency })
            .Select(g => new ReceivableCurrencyBucket(
                g.Key.ClientId,
                g.Max(i => i.Client.Name) ?? "Unknown",
                g.Key.Currency ?? "",
                g.Sum(i => i.Total - i.paidAmound)))
            .ToListAsync();

    private (decimal TotalOutstanding, List<DashboardSliceDto> TopClients) BuildReceivablesInReportCurrency(
        IReadOnlyList<ReceivableCurrencyBucket> buckets,
        string reportCode,
        IReadOnlyDictionary<string, decimal> usdRates)
    {
        var byClient = new Dictionary<Guid, (string Name, decimal Total)>();
        decimal totalOutstanding = 0;

        foreach (var bucket in buckets)
        {
            var source = (bucket.Currency ?? "").Trim().ToUpperInvariant();
            if (source.Length != 3) source = reportCode;

            var converted = _currencyRates.TryConvert(bucket.Outstanding, source, reportCode, usdRates);
            if (converted == null) continue;

            totalOutstanding += converted.Value;

            if (byClient.TryGetValue(bucket.ClientId, out var existing))
                byClient[bucket.ClientId] = (existing.Name, existing.Total + converted.Value);
            else
                byClient[bucket.ClientId] = (bucket.ClientName, converted.Value);
        }

        var topClients = byClient
            .Select(kv => new DashboardSliceDto(kv.Value.Name, kv.Value.Total, reportCode))
            .Where(s => s.Value > 0)
            .OrderByDescending(s => s.Value)
            .Take(TopReceivableClients)
            .ToList();

        return (totalOutstanding, topClients);
    }

    private static string? NormalizeReportCurrency(string? code)
    {
        if (string.IsNullOrWhiteSpace(code)) return null;
        var n = code.Trim().ToUpperInvariant();
        return n.Length == 3 ? n : null;
    }

    private static string ResolveReportCurrency(string? reportCurrency, IReadOnlyList<string> availableCurrencies)
    {
        var normalized = NormalizeReportCurrency(reportCurrency);
        if (!string.IsNullOrEmpty(normalized))
            return normalized;

        if (availableCurrencies.Any(c => string.Equals(c, DefaultReportCurrency, StringComparison.OrdinalIgnoreCase)))
            return DefaultReportCurrency;

        return availableCurrencies.Count > 0
            ? availableCurrencies[0].Trim().ToUpperInvariant()
            : DefaultReportCurrency;
    }

    private sealed record ReceivableCurrencyBucket(
        Guid ClientId,
        string ClientName,
        string Currency,
        decimal Outstanding);
}
