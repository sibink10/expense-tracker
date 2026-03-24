import { EXP_S, ADV_S } from "./constants";

/**
 * Statuses where amount/purpose/bill date cannot be edited by non-admins (matches API ExpenseService).
 * Rejected is intentionally excluded — resubmit moves back to Pending Approval.
 */
export function isExpenseFieldEditLockedForNonAdmin(status: string): boolean {
  const s = status.trim();
  return (
    s === EXP_S.APPROVED ||
    s === EXP_S.AWAITING_BILL ||
    s === EXP_S.AWAITING_PAYMENT ||
    s === EXP_S.PARTIALLY_PAID ||
    s === EXP_S.COMPLETED ||
    s === EXP_S.CANCELLED
  );
}

/**
 * Edit expense fields in the UI (amount, purpose, date, optional docs on save).
 * When status is approved or later, hide edit for everyone — use API if an admin must correct data.
 * Rejected stays editable (resubmit → Pending Approval on save).
 */
export function canEditExpenseFields(status: string): boolean {
  return !isExpenseFieldEditLockedForNonAdmin(status);
}

/**
 * After approval without bills, submitter uploads supporting documents (separate from field edit).
 */
export function canShowApprovedBillUploadPanel(status: string, hasBill: boolean): boolean {
  return status === EXP_S.APPROVED && !hasBill;
}

export function isExpenseCancelled(status: string): boolean {
  return status.trim() === EXP_S.CANCELLED;
}

/** Matches API: only initial pending approval can be cancelled by submitter/admin. */
export function canCancelExpenseByStatus(status: string): boolean {
  return status.trim() === EXP_S.PENDING;
}

/** Matches API: only pending advances can be cancelled. */
export function canCancelAdvanceByStatus(status: string): boolean {
  return status.trim() === ADV_S.PENDING;
}
