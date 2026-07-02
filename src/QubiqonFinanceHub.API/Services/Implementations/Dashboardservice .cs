using Microsoft.EntityFrameworkCore;
using QubiqonFinanceHub.API.Auth.Finance;
using QubiqonFinanceHub.API.Data;
using QubiqonFinanceHub.API.DTOs;
using QubiqonFinanceHub.API.Models.Entities;
using QubiqonFinanceHub.API.Models.Enums;
using QubiqonFinanceHub.API.Services.Helpers;
using QubiqonFinanceHub.API.Services.Interfaces;

namespace QubiqonFinanceHub.API.Services.Implementations;

public class DashboardService : IDashboardService
{
    private const int TopClients = 8;
    private const string DefaultReportCurrency = "INR";

    private static readonly InvoiceStatusCountsDto EmptyInvoiceCounts = new(0, 0, 0, 0, 0);
    private static readonly List<DashboardSliceDto> EmptySlices = [];

    private readonly FinanceHubDbContext _db;
    private readonly ITenantService _tenant;
    private readonly ICurrencyRateService _currencyRates;

    public DashboardService(
        FinanceHubDbContext db,
        ITenantService tenant,
        ICurrencyRateService currencyRates)
    {
        _db = db;
        _tenant = tenant;
        _currencyRates = currencyRates;
    }

    public async Task<DashboardDto> GetStatsAsync(
        bool myOnly = false,
        string? reportCurrency = null,
        DashboardPeriod period = DashboardPeriod.Total)
    {
        var role = FinanceEmployeeRoleHelper.ResolveUserRole(await _tenant.GetCurrentEmployeeAsync());
        var scopeMyOnly = myOnly || role == UserRole.Employee;
        var includeBills = role is UserRole.Approver or UserRole.Finance or UserRole.Admin;
        var includeInvoices = role is UserRole.Finance or UserRole.Admin;
        var includeReceivables = includeInvoices;

        var orgId = await _tenant.GetCurrentOrganizationId();
        var empId = _tenant.GetCurrentEmployeeId();
        var todayUtc = DateTime.UtcNow.Date;
        (DateTime Start, DateTime End)? monthRange =
            period == DashboardPeriod.Month ? GetCurrentMonthRangeUtc() : null;

        var expenses = _db.ExpenseRequests.Where(e => e.OrganizationId == orgId);
        if (scopeMyOnly) expenses = expenses.Where(e => e.EmployeeId == empId);
        if (monthRange != null)
            expenses = expenses.Where(e => e.CreatedAt >= monthRange.Value.Start && e.CreatedAt < monthRange.Value.End);

        var advances = _db.AdvancePayments.Where(a => a.OrganizationId == orgId);
        if (scopeMyOnly) advances = advances.Where(a => a.EmployeeId == empId);
        if (monthRange != null)
            advances = advances.Where(a => a.CreatedAt >= monthRange.Value.Start && a.CreatedAt < monthRange.Value.End);

        var pendingExpenseApprovals =
            await _db.ExpenseRequests.Where(e => e.OrganizationId == orgId)
                .Where(e => scopeMyOnly ? e.EmployeeId == empId : true)
                .CountAsync(e =>
                    e.Status == ExpenseStatus.PendingApproval ||
                    e.Status == ExpenseStatus.AwaitingBill ||
                    e.Status == ExpenseStatus.PendingBillApproval);
        var pendingAdvanceOnly =
            await _db.AdvancePayments.Where(a => a.OrganizationId == orgId)
                .Where(a => scopeMyOnly ? a.EmployeeId == empId : true)
                .CountAsync(a => a.Status == AdvanceStatus.Pending);
        var pendingApprovals = pendingExpenseApprovals + pendingAdvanceOnly;

        var expenseSlices = await BuildExpenseSlicesAsync(expenses);
        var advanceSlices = await BuildAdvanceSlicesAsync(advances);

        var pendingSubmittedBills = 0;
        var billsToPayCount = 0;
        decimal billsToPayAmount = 0;
        List<DashboardSliceDto> billsPayableSlices = EmptySlices;

        if (includeBills)
        {
            var billsQuery = _db.VendorBills.Where(b => b.OrganizationId == orgId).AsNoTracking();
            var allBills = await billsQuery.ToListAsync();
            pendingSubmittedBills = allBills.Count(b => b.Status == BillStatus.Submitted);

            var chartBills = monthRange != null
                ? allBills
                    .Where(b => b.BillDate >= monthRange.Value.Start && b.BillDate < monthRange.Value.End)
                    .ToList()
                : allBills;

            (_, billsToPayCount, billsToPayAmount) = BuildBillsPayableAggregates(allBills, todayUtc);
            (billsPayableSlices, _, _) = BuildBillsPayableAggregates(chartBills, todayUtc);
        }

        var invoiceCounts = EmptyInvoiceCounts;
        List<DashboardSliceDto> clientRevenueByClient = EmptySlices;

        IReadOnlyList<string> availableCurrencies = [DefaultReportCurrency];
        string reportCode = DefaultReportCurrency;
        decimal receivableOutstanding = 0;
        List<DashboardSliceDto> receivablesByClient = EmptySlices;

        if (includeInvoices)
        {
            var invoices = _db.Invoices.Where(i => i.OrganizationId == orgId).AsNoTracking();
            invoiceCounts = await GetInvoiceStatusCountsAsync(invoices, todayUtc, monthRange);

            var (usdRates, currencies) = await _currencyRates.LoadUsdReportingRatesAsync();
            availableCurrencies = currencies;
            reportCode = ResolveReportCurrency(reportCurrency, availableCurrencies);

            if (includeReceivables)
            {
                var receivableBuckets = await LoadReceivableCurrencyBucketsAsync(invoices);
                (receivableOutstanding, receivablesByClient) =
                    BuildReceivablesInReportCurrency(receivableBuckets, reportCode, usdRates);
            }

            var revenueBuckets = await LoadClientRevenueCurrencyBucketsAsync(invoices, monthRange);
            clientRevenueByClient = BuildClientRevenueInReportCurrency(revenueBuckets, reportCode, usdRates);
        }
        else
        {
            reportCode = ResolveReportCurrency(reportCurrency, availableCurrencies);
        }

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
            clientRevenueByClient,
            availableCurrencies,
            reportCode);
    }

    private static (DateTime Start, DateTime End) GetCurrentMonthRangeUtc()
    {
        var now = DateTime.UtcNow;
        var start = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var end = start.AddMonths(1);
        return (start, end);
    }

    private static async Task<InvoiceStatusCountsDto> GetInvoiceStatusCountsAsync(
        IQueryable<Invoice> invoices,
        DateTime today,
        (DateTime Start, DateTime End)? monthRange)
    {
        if (monthRange != null)
        {
            invoices = invoices.Where(i =>
                i.InvoiceDate >= monthRange.Value.Start && i.InvoiceDate < monthRange.Value.End);
        }

        var draft = await invoices.CountAsync(x => x.Status == InvoiceStatus.Draft);
        var sent = await invoices.CountAsync(x =>
            x.Status == InvoiceStatus.Sent
            && !(x.paidAmound < x.Total && x.DueDate < today));
        var partiallyPaid = await invoices.CountAsync(x =>
            x.Status == InvoiceStatus.PartiallyPaid
            && !(x.paidAmound < x.Total && x.DueDate < today));
        var paid = await invoices.CountAsync(x => x.Status == InvoiceStatus.Paid);
        var overdue = await invoices.CountAsync(x =>
            x.paidAmound < x.Total
            && x.DueDate < today
            && (x.Status == InvoiceStatus.Sent || x.Status == InvoiceStatus.PartiallyPaid));

        return new InvoiceStatusCountsDto(draft, sent, partiallyPaid, paid, overdue);
    }

    private static async Task<List<ClientRevenueCurrencyBucket>> LoadClientRevenueCurrencyBucketsAsync(
        IQueryable<Invoice> invoices,
        (DateTime Start, DateTime End)? monthRange)
    {
        var query = invoices.Where(i =>
            i.paidAmound > 0
            && (i.Status == InvoiceStatus.Paid || i.Status == InvoiceStatus.PartiallyPaid));

        if (monthRange != null)
        {
            query = query.Where(i =>
                i.PaidAt != null
                && i.PaidAt >= monthRange.Value.Start
                && i.PaidAt < monthRange.Value.End);
        }

        return await query
            .GroupBy(i => new { i.ClientId, i.Currency })
            .Select(g => new ClientRevenueCurrencyBucket(
                g.Key.ClientId,
                g.Max(i => i.Client.Name) ?? "Unknown",
                g.Key.Currency ?? "",
                g.Sum(i => i.paidAmound)))
            .ToListAsync();
    }

    private List<DashboardSliceDto> BuildClientRevenueInReportCurrency(
        IReadOnlyList<ClientRevenueCurrencyBucket> buckets,
        string reportCode,
        IReadOnlyDictionary<string, decimal> usdRates)
    {
        var byClient = new Dictionary<Guid, (string Name, decimal Total)>();

        foreach (var bucket in buckets)
        {
            var source = (bucket.Currency ?? "").Trim().ToUpperInvariant();
            if (source.Length != 3) source = reportCode;

            var converted = _currencyRates.TryConvert(bucket.Collected, source, reportCode, usdRates);
            if (converted == null) continue;

            if (byClient.TryGetValue(bucket.ClientId, out var existing))
                byClient[bucket.ClientId] = (existing.Name, existing.Total + converted.Value);
            else
                byClient[bucket.ClientId] = (bucket.ClientName, converted.Value);
        }

        return byClient
            .Select(kv => new DashboardSliceDto(kv.Value.Name, kv.Value.Total, reportCode))
            .Where(s => s.Value > 0)
            .OrderByDescending(s => s.Value)
            .Take(TopClients)
            .ToList();
    }

    private static bool VendorBillEligibleForBillsToPay(VendorBill b) =>
        b.Status != BillStatus.Paid
        && b.Status != BillStatus.Rejected
        && b.Status != BillStatus.Draft
        && b.PaidAmount < b.TotalPayable;

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
            .Take(TopClients)
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

    private sealed record ClientRevenueCurrencyBucket(
        Guid ClientId,
        string ClientName,
        string Currency,
        decimal Collected);
}
