using Microsoft.EntityFrameworkCore;
using QubiqonFinanceHub.API.Data;
using QubiqonFinanceHub.API.DTOs;
using QubiqonFinanceHub.API.Models.Enums;
using QubiqonFinanceHub.API.Services.Interfaces;

namespace QubiqonFinanceHub.API.Services.Implementations;

public class DashboardService : IDashboardService
{
    private readonly FinanceHubDbContext _db;
    private readonly ITenantService _tenant;

    public DashboardService(FinanceHubDbContext db, ITenantService tenant)
    { _db = db; _tenant = tenant; }

    public async Task<DashboardDto> GetStatsAsync(bool myOnly = false)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var empId = _tenant.GetCurrentEmployeeId();

        var expenses = _db.ExpenseRequests.Where(e => e.OrganizationId == orgId);
        if (myOnly) expenses = expenses.Where(e => e.EmployeeId == empId);

        var advances = _db.AdvancePayments.Where(a => a.OrganizationId == orgId);
        if (myOnly) advances = advances.Where(a => a.EmployeeId == empId);

        var bills = _db.VendorBills.Where(b => b.OrganizationId == orgId);
        var invoices = _db.Invoices.Where(i => i.OrganizationId == orgId);
        var now = DateTime.UtcNow;

        var pendingExpenses = await expenses.CountAsync(e => e.Status == ExpenseStatus.PendingApproval);
        var approvedExpenses = await expenses.CountAsync(e => e.Status == ExpenseStatus.Approved);
        var completedExpenses = await expenses.CountAsync(e => e.Status == ExpenseStatus.Completed);

        var pendingBills = await bills.CountAsync(b => b.Status == BillStatus.Submitted);
        var billsToPay = await bills.Where(b => b.Status == BillStatus.Approved).ToListAsync();
        var billsToPayCount = billsToPay.Count;
        var billsToPayAmount = billsToPay.Sum(b => b.TotalPayable);

        var pendingAdvances = await advances.CountAsync(a => a.Status == AdvanceStatus.Pending);

        var draftInvoices = await invoices.CountAsync(i => i.Status == InvoiceStatus.Draft);
        var sentInvoices = await invoices.CountAsync(i => i.Status == InvoiceStatus.Sent);
        var paidInvoices = await invoices.CountAsync(i => i.Status == InvoiceStatus.Paid);
        var overdueInvoices = await invoices.CountAsync(i => i.Status == InvoiceStatus.Sent && i.DueDate < now);
        var totalReceivable = await invoices.Where(i => i.Status == InvoiceStatus.Sent).SumAsync(i => i.Total);

        return new DashboardDto(
            pendingExpenses, approvedExpenses, completedExpenses,
            pendingBills, billsToPayCount, billsToPayAmount,
            pendingAdvances,
            draftInvoices, sentInvoices, paidInvoices, overdueInvoices, totalReceivable
        );
    }
}