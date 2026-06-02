import type { ModalData, AppUser, Expense, Advance, Bill, Invoice } from "../types";
import { EXP_S, BILL_S, ADV_S, INV_S, ROLES, MODAL_T, ITEM_T } from "./constants";

/** Finance and admin may record payments / disburse / mark invoice paid. */
function isFinanceOrAdmin(user: AppUser): boolean {
  return user.role === ROLES.FINANCE || user.role === ROLES.ADMIN;
}

function isApproverOrAdmin(user: AppUser): boolean {
  return user.role === ROLES.APPROVER || user.role === ROLES.ADMIN || user.role === ROLES.FINANCE;
}

/** Normalize `type` query param (handles accidental quotes). */
export function normalizeLinkType(raw: string | null): string | null {
  if (raw == null) return null;
  const t = raw.trim().replace(/^["']|["']$/g, "").toLowerCase();
  return t || null;
}

/**
 * Deep-link modal resolution. When `typeHint` is set (from email `?type=`), open that modal
 * if the entity status and role still allow it; otherwise fall back to detail or the default rule.
 */
export function resolveExpenseDeepLink(e: Expense, user: AppUser, typeHint?: string | null): ModalData {
  const hasBill = e.documents.length > 0 || !!(e.file || e.attachmentUrl);
  const statusAllowsPay =
    e.status === EXP_S.AWAITING_PAYMENT ||
    e.status === EXP_S.PARTIALLY_PAID ||
    e.status === EXP_S.APPROVED ||
    e.status === EXP_S.AWAITING_BILL;

  const pendingApproval =
    e.status === EXP_S.PENDING || e.status === EXP_S.PENDING_BILL_APPROVAL;

  const type = normalizeLinkType(typeHint ?? null);

  if (type === "approve") {
    if (isApproverOrAdmin(user) && pendingApproval) return { t: MODAL_T.EXP_APPROVE, d: e };
    return { t: MODAL_T.EXP_DETAIL, d: e };
  }
  if (type === MODAL_T.REJECT) {
    if (isApproverOrAdmin(user) && pendingApproval) return { t: MODAL_T.REJECT, d: e, it: ITEM_T.EXPENSE };
    return { t: MODAL_T.EXP_DETAIL, d: e };
  }
  if (type === MODAL_T.PAY) {
    if (isFinanceOrAdmin(user) && statusAllowsPay && hasBill) return { t: MODAL_T.PAY, d: e, it: ITEM_T.EXPENSE };
    return { t: MODAL_T.EXP_DETAIL, d: e };
  }
  if (type === "detail") return { t: MODAL_T.EXP_DETAIL, d: e };

  if (isFinanceOrAdmin(user) && statusAllowsPay && hasBill) {
    return { t: MODAL_T.PAY, d: e, it: ITEM_T.EXPENSE };
  }
  return { t: MODAL_T.EXP_DETAIL, d: e };
}

export function resolveAdvanceDeepLink(a: Advance, user: AppUser, typeHint?: string | null): ModalData {
  const statusAllowsDisburse = a.status === ADV_S.APPROVED || a.status === ADV_S.PARTIALLY_DISBURSED;
  const pending = a.status === ADV_S.PENDING;
  const type = normalizeLinkType(typeHint ?? null);

  if (type === "approve") {
    if (isApproverOrAdmin(user) && pending) return { t: MODAL_T.ADV_APPROVE, d: a };
    return { t: MODAL_T.ADV_DETAIL, d: a };
  }
  if (type === MODAL_T.REJECT) {
    if (isApproverOrAdmin(user) && pending) return { t: MODAL_T.REJECT, d: a, it: ITEM_T.ADVANCE };
    return { t: MODAL_T.ADV_DETAIL, d: a };
  }
  if (type === "disburse") {
    if (isFinanceOrAdmin(user) && statusAllowsDisburse) return { t: MODAL_T.ADV_DISBURSE, d: a };
    return { t: MODAL_T.ADV_DETAIL, d: a };
  }
  if (type === "detail") return { t: MODAL_T.ADV_DETAIL, d: a };

  if (isFinanceOrAdmin(user) && statusAllowsDisburse) {
    return { t: MODAL_T.ADV_DISBURSE, d: a };
  }
  return { t: MODAL_T.ADV_DETAIL, d: a };
}

export function resolveBillDeepLink(b: Bill, user: AppUser, typeHint?: string | null): ModalData {
  const statusAllowsPay =
    b.status === BILL_S.APPROVED || b.status === BILL_S.OVERDUE || b.status === BILL_S.PARTIALLY_PAID;
  const submitted = b.status === BILL_S.SUBMITTED;
  const type = normalizeLinkType(typeHint ?? null);

  if (type === "approve") {
    if (isApproverOrAdmin(user) && submitted) return { t: MODAL_T.BILL_APPROVE, d: b, it: ITEM_T.BILL };
    return { t: MODAL_T.BILL_DETAIL, d: b };
  }
  if (type === MODAL_T.REJECT) {
    if (isApproverOrAdmin(user) && submitted) return { t: MODAL_T.REJECT, d: b, it: ITEM_T.BILL };
    return { t: MODAL_T.BILL_DETAIL, d: b };
  }
  if (type === MODAL_T.PAY) {
    if (isFinanceOrAdmin(user) && statusAllowsPay) return { t: MODAL_T.PAY, d: b, it: ITEM_T.BILL };
    return { t: MODAL_T.BILL_DETAIL, d: b };
  }
  if (type === "detail") return { t: MODAL_T.BILL_DETAIL, d: b };

  if (isFinanceOrAdmin(user) && statusAllowsPay) {
    return { t: MODAL_T.PAY, d: b, it: ITEM_T.BILL };
  }
  return { t: MODAL_T.BILL_DETAIL, d: b };
}

export function resolveInvoiceDeepLink(inv: Invoice, user: AppUser, typeHint?: string | null): ModalData {
  const unpaid = inv.total - (inv.paidAmound ?? 0) > 0.001;
  const canMarkPaid =
    isFinanceOrAdmin(user) &&
    unpaid &&
    inv.status !== INV_S.DRAFT &&
    inv.status !== INV_S.PAID;

  const type = normalizeLinkType(typeHint ?? null);

  if (type === MODAL_T.INV_PAY || type === MODAL_T.PAY) {
    if (canMarkPaid) return { t: MODAL_T.INV_PAY, d: inv };
    return { t: MODAL_T.INV_DETAIL, d: inv };
  }
  if (type === "detail") return { t: MODAL_T.INV_DETAIL, d: inv };

  if (canMarkPaid) {
    return { t: MODAL_T.INV_PAY, d: inv };
  }
  return { t: MODAL_T.INV_DETAIL, d: inv };
}
