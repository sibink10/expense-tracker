using QubiqonFinanceHub.API.Models.Entities;
using QubiqonFinanceHub.API.Models.Enums;

namespace QubiqonFinanceHub.API.Services.Helpers;

/// <summary>
/// In-memory vendor bill status rules used by <c>VendorBillService</c> for BillDto display
/// and by <c>DashboardService</c> for bills-to-pay slices. Must stay aligned with
/// <c>GET /api/bills</c> overdue filtering in <c>VendorBillService.ListAsync</c>.
/// </summary>
public static class VendorBillStatusRules
{
    /// <summary>
    /// Payable workflow states that can become display-overdue when past due with an open balance.
    /// </summary>
    public static bool IsPayableOverdueCandidate(BillStatus status) =>
        status == BillStatus.Approved || status == BillStatus.PartiallyPaid;

    /// <summary>
    /// Overdue is not a stored workflow state (<see cref="BillStatus.Overdue"/>); it is derived for
    /// Approved or PartiallyPaid bills past due with an open balance — same rule as bills list API.
    /// </summary>
    public static bool IsComputationallyOverdue(VendorBill b, DateTime utcTodayDate) =>
        IsPayableOverdueCandidate(b.Status)
        && b.DueDate < utcTodayDate
        && b.PaidAmount < b.TotalPayable;
}
