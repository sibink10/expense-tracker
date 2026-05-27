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
    /// Overdue is not a stored workflow state in practice; it is derived the same way as the bills list API.
    /// </summary>
    public static bool IsComputationallyOverdue(VendorBill b, DateTime utcTodayDate) =>
        b.DueDate < utcTodayDate
        && b.PaidAmount < b.TotalPayable
        && b.Status != BillStatus.Paid;
}
