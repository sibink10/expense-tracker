import { apiClient } from "./client";
import type { Expense } from "../../types";
import type { ActivityComment, FileRef } from "../../types";
import { EXP_S } from "../constants";

// ─── API types ─────────────────────────────────────────────────
export interface ApiExpenseComment {
  id: string;
  by: string;
  text: string;
  actionType: string;
  createdAt: string;
}

export interface ApiExpenseItem {
  id: string;
  expenseCode: string;
  employeeId: string;
  employeeName: string;
  department: string;
  amount: number;
  purpose: string;
  requiredByDate: string;
  status: string;
  attachmentUrl: string | null;
  paymentReference: string | null;
  createdAt: string;
  comments: ApiExpenseComment[];
}

export interface ApiExpensesResponse {
  items: ApiExpenseItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
}

const STATUS_MAP: Record<string, string> = {
  PendingApproval: EXP_S.PENDING,
  Approved: EXP_S.APPROVED,
  Rejected: EXP_S.REJECTED,
  Cancelled: EXP_S.CANCELLED,
  AwaitingBill: EXP_S.AWAITING_BILL,
  Completed: EXP_S.COMPLETED,
};

function mapActionTypeToT(actionType: string): "ok" | "no" | "pay" | "sent" {
  const s = actionType?.toLowerCase() || "";
  if (s.includes("approv") || s === "ok") return "ok";
  if (s.includes("reject") || s === "no") return "no";
  if (s.includes("pay") || s.includes("disburs")) return "pay";
  return "sent";
}

function mapApiComment(c: ApiExpenseComment): ActivityComment {
  const d = c.createdAt ? c.createdAt.split("T")[0] : "";
  return {
    by: c.by,
    text: c.text,
    d,
    t: mapActionTypeToT(c.actionType),
  };
}

function mapApiExpenseToApp(item: ApiExpenseItem): Expense {
  const status = STATUS_MAP[item.status] ?? item.status;
  const file: FileRef | null = item.attachmentUrl
    ? { n: item.attachmentUrl.split("/").pop() || "file", s: "—" }
    : null;
  return {
    id: item.expenseCode,
    apiId: item.id,
    empId: 0,
    empName: item.employeeName,
    dept: item.department || "",
    amt: item.amount,
    purpose: item.purpose,
    reqBy: item.requiredByDate ? item.requiredByDate.split("T")[0] : "",
    status,
    at: item.createdAt ? item.createdAt.split("T")[0] : "",
    file,
    comments: (item.comments || []).map(mapApiComment),
  };
}

export interface GetExpensesParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  /** When true, fetches only current user's expenses (/expenses/my). When false, fetches all (/expenses) for admin. */
  myOnly?: boolean;
}

export async function getExpenses(params: GetExpensesParams = {}): Promise<ApiExpensesResponse> {
  const apiParams = {
    Page: params.page,
    PageSize: params.pageSize,
    Search: params.search,
    Status: params.status,
  };
  const path = params.myOnly !== false ? "/expenses/my" : "/expenses";
  const { data } = await apiClient.get<ApiExpensesResponse>(path, {
    params: apiParams,
  });
  return data;
}

export async function getExpensesMapped(params: GetExpensesParams = {}): Promise<{
  items: Expense[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
}> {
  const res = await getExpenses(params);
  return {
    ...res,
    items: res.items.map(mapApiExpenseToApp),
  };
}

export interface ExpenseCounts {
  pendExp: number;
  payableCount: number;
}

export interface CreateExpensePayload {
  amount: number;
  purpose: string;
  requiredByDate: string;
  onBehalfOfEmployeeId: string | null;
}

export async function createExpense(payload: CreateExpensePayload): Promise<unknown> {
  const { data } = await apiClient.post("/expenses", payload);
  return data;
}

export async function approveExpense(id: string, comments: string): Promise<unknown> {
  const { data } = await apiClient.post(`/expenses/${id}/approve`, { comments });
  return data;
}

export async function rejectExpense(id: string, comments: string): Promise<unknown> {
  const { data } = await apiClient.post(`/expenses/${id}/reject`, { comments });
  return data;
}

/** Lightweight fetch for counts (Dashboard, nav badges). */
export async function getExpenseCounts(): Promise<ExpenseCounts> {
  try {
    const [pendingRes, approvedRes, awaitingRes] = await Promise.all([
      getExpenses({ page: 1, pageSize: 1, status: "PendingApproval" }),
      getExpenses({ page: 1, pageSize: 1, status: "Approved" }),
      getExpenses({ page: 1, pageSize: 1, status: "AwaitingBill" }),
    ]);
    return {
      pendExp: pendingRes.totalCount ?? 0,
      payableCount: (approvedRes.totalCount ?? 0) + (awaitingRes.totalCount ?? 0),
    };
  } catch {
    return { pendExp: 0, payableCount: 0 };
  }
}
