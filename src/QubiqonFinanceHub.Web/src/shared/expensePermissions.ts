import { EXP_S, ADV_S } from "./constants";
import type { Advance, AppUser, Expense } from "../types";

function normId(v: string | number | undefined | null): string {
  return String(v ?? "").trim().toLowerCase();
}

/** Compare logged-in `user.id` to an API employee Guid string (case-insensitive). */
export function userMatchesEmployeeGuid(
  user: AppUser | null | undefined,
  employeeGuid: string | undefined | null,
): boolean {
  if (!user?.id) return false;
  const g = (employeeGuid ?? "").trim();
  if (!g) return false;
  return normId(user.id) === normId(g);
}

/**
 * Matches API expense approve self-check: submitter or beneficiary cannot approve.
 * Uses `user.id` vs `submittedByEmployeeId` / `employeeId` (Guid); dev mock falls back to `empId` vs numeric `user.id`.
 */
export function expenseUserIsSubmitterOrBeneficiary(e: Expense, user: AppUser | null | undefined): boolean {
  if (!user?.id) return false;
  if (userMatchesEmployeeGuid(user, e.submittedByEmployeeId) || userMatchesEmployeeGuid(user, e.employeeId)) {
    return true;
  }
  if (e.empId != null && e.empId > 0) {
    return String(user.id) === String(e.empId);
  }
  return false;
}

/**
 * True when the logged-in user raised/submitted the expense (`SubmittedBy` / raiser Guid).
 * Dev mock: when Guids are absent, uses `empId` if set.
 */
export function expenseRaisedByCurrentUser(e: Expense, user: AppUser | null | undefined): boolean {
  if (!user?.id) return false;
  const raiser = e.submittedByEmployeeId ?? e.employeeId;
  if (raiser) return userMatchesEmployeeGuid(user, raiser);
  if (e.empId != null && e.empId > 0) return String(user.id) === String(e.empId);
  return false;
}

/** Advance raiser is `EmployeeId` on the advance (Guid); mock uses `empId`. */
export function advanceRaisedByCurrentUser(a: Advance, user: AppUser | null | undefined): boolean {
  if (!user?.id) return false;
  if (userMatchesEmployeeGuid(user, a.employeeId)) return true;
  if (a.empId != null && a.empId > 0) return String(user.id) === String(a.empId);
  return false;
}

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

/** Matches API `ExpenseStatus.PendingApproval` — not Pending Bill Approval or any other status. */
export function canCancelExpenseByStatus(status: string): boolean {
  return status.trim() === EXP_S.PENDING;
}

/** Expense cancel: raiser only, and only while status is Pending Approval. */
export function canCancelExpenseRequest(e: Expense, user: AppUser | null | undefined): boolean {
  return canCancelExpenseByStatus(e.status) && expenseRaisedByCurrentUser(e, user);
}

/** Matches API `AdvanceStatus.Pending` only. */
export function canCancelAdvanceByStatus(status: string): boolean {
  return status.trim() === ADV_S.PENDING;
}

/** Advance cancel: raiser only, and only while status is Pending. */
export function canCancelAdvanceRequest(a: Advance, user: AppUser | null | undefined): boolean {
  return canCancelAdvanceByStatus(a.status) && advanceRaisedByCurrentUser(a, user);
}

/** “My” expenses for lists: mock uses `empId`; API uses employee Guid vs `user.id`. */
export function expenseBelongsToCurrentUser(e: Expense, user: AppUser | null | undefined): boolean {
  if (!user?.id) return false;
  if (userMatchesEmployeeGuid(user, e.employeeId)) return true;
  if (e.empId != null && e.empId > 0) return String(user.id) === String(e.empId);
  return false;
}
