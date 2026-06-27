using QubiqonFinanceHub.API.Models.Entities;
using QubiqonFinanceHub.API.Models.Enums;

namespace QubiqonFinanceHub.API.Services.Helpers;

/// <summary>
/// Invoice status rules shared by <c>InvoiceService</c> (list, counts, display) and
/// <c>DashboardService</c> (receivables). Overdue is derived for Sent/PartiallyPaid only.
/// </summary>
public static class InvoiceStatusRules
{
    public static bool HasUnpaidBalance(Invoice inv) =>
        inv.paidAmound < inv.Total;

    /// <summary>Invoice has been sent to the client (collectible).</summary>
    public static bool IsSentOrPartiallyPaid(InvoiceStatus status) =>
        status is InvoiceStatus.Sent or InvoiceStatus.PartiallyPaid;

    /// <summary>Unpaid balance on a Sent or PartiallyPaid invoice — counts toward receivables.</summary>
    public static bool IsReceivable(Invoice inv) =>
        HasUnpaidBalance(inv) && IsSentOrPartiallyPaid(inv.Status);

    /// <summary>Past due with open balance on a receivable (Sent/PartiallyPaid) invoice.</summary>
    public static bool IsReceivableAndOverdue(Invoice inv, DateTime utcTodayDate) =>
        IsReceivable(inv)
        && inv.DueDate < utcTodayDate;

    /// <summary>Past due with open balance (any non-paid status). Used for list badge danger styling on pre-send rows.</summary>
    public static bool IsPastDueUnpaid(Invoice inv, DateTime utcTodayDate) =>
        inv.Status is not (InvoiceStatus.Paid or InvoiceStatus.Cancelled)
        && HasUnpaidBalance(inv)
        && inv.DueDate < utcTodayDate;

    public static bool IsSigningWorkflowStatus(InvoiceStatus status) =>
        status is InvoiceStatus.PendingSignature
            or InvoiceStatus.Signed
            or InvoiceStatus.SignatureFailed;

    /// <summary>Display status for API DTOs: Overdue only when receivable and past due; signing/draft keep stored status.</summary>
    public static string GetDisplayStatus(Invoice inv, DateTime utcTodayDate)
    {
        if (IsSigningWorkflowStatus(inv.Status) || inv.Status is InvoiceStatus.Draft or InvoiceStatus.Cancelled)
            return inv.Status.ToString();

        if (IsReceivableAndOverdue(inv, utcTodayDate))
            return InvoiceStatus.Overdue.ToString();

        return inv.Status.ToString();
    }
}
