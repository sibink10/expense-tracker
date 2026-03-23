import type { ModalData, AppUser, Expense, Advance, Bill, Invoice } from "../types";
import { EXP_S, BILL_S, ADV_S, INV_S } from "./constants";

/** Finance and admin may record payments / disburse / mark invoice paid. */
function isFinanceOrAdmin(user: AppUser): boolean {
  return user.role === "finance" || user.role === "admin";
}

function isApproverOrAdmin(user: AppUser): boolean {
  return user.role === "approver" || user.role === "admin";
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
    if (isApproverOrAdmin(user) && pendingApproval) return { t: "exp-approve", d: e };
    return { t: "exp-detail", d: e };
  }
  if (type === "reject") {
    if (isApproverOrAdmin(user) && pendingApproval) return { t: "reject", d: e, it: "expense" };
    return { t: "exp-detail", d: e };
  }
  if (type === "pay") {
    if (isFinanceOrAdmin(user) && statusAllowsPay && hasBill) return { t: "pay", d: e, it: "expense" };
    return { t: "exp-detail", d: e };
  }
  if (type === "detail") return { t: "exp-detail", d: e };

  if (isFinanceOrAdmin(user) && statusAllowsPay && hasBill) {
    return { t: "pay", d: e, it: "expense" };
  }
  return { t: "exp-detail", d: e };
}

export function resolveAdvanceDeepLink(a: Advance, user: AppUser, typeHint?: string | null): ModalData {
  const statusAllowsDisburse = a.status === ADV_S.APPROVED || a.status === ADV_S.PARTIALLY_DISBURSED;
  const pending = a.status === ADV_S.PENDING;
  const type = normalizeLinkType(typeHint ?? null);

  if (type === "approve") {
    if (isApproverOrAdmin(user) && pending) return { t: "adv-approve", d: a };
    return { t: "adv-detail", d: a };
  }
  if (type === "reject") {
    if (isApproverOrAdmin(user) && pending) return { t: "reject", d: a, it: "advance" };
    return { t: "adv-detail", d: a };
  }
  if (type === "disburse") {
    if (isFinanceOrAdmin(user) && statusAllowsDisburse) return { t: "adv-disburse", d: a };
    return { t: "adv-detail", d: a };
  }
  if (type === "detail") return { t: "adv-detail", d: a };

  if (isFinanceOrAdmin(user) && statusAllowsDisburse) {
    return { t: "adv-disburse", d: a };
  }
  return { t: "adv-detail", d: a };
}

export function resolveBillDeepLink(b: Bill, user: AppUser, typeHint?: string | null): ModalData {
  const statusAllowsPay =
    b.status === BILL_S.APPROVED || b.status === BILL_S.OVERDUE || b.status === BILL_S.PARTIALLY_PAID;
  const submitted = b.status === BILL_S.SUBMITTED;
  const type = normalizeLinkType(typeHint ?? null);

  if (type === "approve") {
    if (isApproverOrAdmin(user) && submitted) return { t: "bill-approve", d: b, it: "bill" };
    return { t: "bill-detail", d: b };
  }
  if (type === "reject") {
    if (isApproverOrAdmin(user) && submitted) return { t: "reject", d: b, it: "bill" };
    return { t: "bill-detail", d: b };
  }
  if (type === "pay") {
    if (isFinanceOrAdmin(user) && statusAllowsPay) return { t: "pay", d: b, it: "bill" };
    return { t: "bill-detail", d: b };
  }
  if (type === "detail") return { t: "bill-detail", d: b };

  if (isFinanceOrAdmin(user) && statusAllowsPay) {
    return { t: "pay", d: b, it: "bill" };
  }
  return { t: "bill-detail", d: b };
}

export function resolveInvoiceDeepLink(inv: Invoice, user: AppUser, typeHint?: string | null): ModalData {
  const unpaid = inv.total - (inv.paidAmound ?? 0) > 0.001;
  const canMarkPaid =
    isFinanceOrAdmin(user) &&
    unpaid &&
    inv.status !== INV_S.DRAFT &&
    inv.status !== INV_S.PAID;

  const type = normalizeLinkType(typeHint ?? null);

  if (type === "inv-pay" || type === "pay") {
    if (canMarkPaid) return { t: "inv-pay", d: inv };
    return { t: "inv-detail", d: inv };
  }
  if (type === "detail") return { t: "inv-detail", d: inv };

  if (canMarkPaid) {
    return { t: "inv-pay", d: inv };
  }
  return { t: "inv-detail", d: inv };
}
