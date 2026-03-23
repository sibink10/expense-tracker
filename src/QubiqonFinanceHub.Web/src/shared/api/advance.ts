import { apiClient } from "./client";
import type { Advance } from "../../types";
import type { ActivityComment } from "../../types";
import { ADV_S } from "../constants";

// ─── API types ─────────────────────────────────────────────────
export interface ApiAdvanceComment {
  id: string;
  by: string;
  text: string;
  actionType: string;
  createdAt: string;
}

export interface ApiAdvanceItem {
  id: string;
  advanceCode: string;
  employeeId: string;
  employeeName: string;
  department: string;
  amount: number;
  paidAmount?: number;
  purpose: string;
  status: string;
  paymentReference: string | null;
  createdAt: string;
  comments: ApiAdvanceComment[];
}

export interface ApiAdvancesResponse {
  items: ApiAdvanceItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
}

const STATUS_MAP: Record<string, string> = {
  Pending: ADV_S.PENDING,
  Approved: ADV_S.APPROVED,
  Rejected: ADV_S.REJECTED,
  Disbursed: ADV_S.DISBURSED,
  PartiallyDisbursed: ADV_S.PARTIALLY_DISBURSED,
};

function mapActionTypeToT(actionType: string): "ok" | "no" | "pay" | "sent" {
  const s = actionType?.toLowerCase() || "";
  if (s.includes("approv") || s === "ok") return "ok";
  if (s.includes("reject") || s === "no") return "no";
  if (s.includes("pay") || s.includes("disburs")) return "pay";
  return "sent";
}

function mapApiComment(c: ApiAdvanceComment): ActivityComment {
  const d = c.createdAt ? c.createdAt.split("T")[0] : "";
  return {
    by: c.by,
    text: c.text,
    d,
    t: mapActionTypeToT(c.actionType),
  };
}

function mapApiAdvanceToApp(item: ApiAdvanceItem): Advance {
  const status = STATUS_MAP[item.status] ?? item.status;
  return {
    id: item.advanceCode,
    apiId: item.id,
    empId: 0,
    empName: item.employeeName,
    dept: item.department || "",
    amt: item.amount,
    paidAmount: item.paidAmount ?? 0,
    purpose: item.purpose,
    status,
    at: item.createdAt ? item.createdAt.split("T")[0] : "",
    comments: (item.comments || []).map(mapApiComment),
  };
}

export interface GetAdvancesMyParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  /** When true, fetches only current user's advances (/advances/my). When false, fetches all (/advances). */
  myOnly?: boolean;
  sortBy?: string;
  desc?: boolean;
}

export async function getAdvancesMy(params: GetAdvancesMyParams = {}): Promise<ApiAdvancesResponse> {
  const apiParams = {
    Page: params.page,
    PageSize: params.pageSize,
    Search: params.search,
    Status: params.status,
    SortBy: params.sortBy,
    Desc: params.desc,
  };
  const path = params.myOnly !== false ? "/advances/my" : "/advances";
  const { data } = await apiClient.get<ApiAdvancesResponse>(path, {
    params: apiParams,
  });
  return data;
}

export async function getAdvancesMyMapped(params: GetAdvancesMyParams = {}): Promise<{
  items: Advance[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
}> {
  const res = await getAdvancesMy(params);
  return {
    ...res,
    items: res.items.map(mapApiAdvanceToApp),
  };
}

/** GET /api/advances/{id} */
export async function getAdvanceById(id: string): Promise<Advance | null> {
  try {
    const { data } = await apiClient.get<ApiAdvanceItem>(`/advances/${id}`);
    return data ? mapApiAdvanceToApp(data) : null;
  } catch {
    return null;
  }
}

export interface CreateAdvancePayload {
  amount: number;
  purpose: string;
}

export async function createAdvance(payload: CreateAdvancePayload): Promise<unknown> {
  const { data } = await apiClient.post("/advances", payload);
  return data;
}

export async function approveAdvance(id: string, comments?: string): Promise<unknown> {
  const { data } = await apiClient.post(`/advances/${id}/approve`, { comments });
  return data;
}

export async function rejectAdvance(id: string, comments: string): Promise<unknown> {
  const { data } = await apiClient.post(`/advances/${id}/reject`, { comments });
  return data;
}

export interface DisburseAdvancePayload {
  paymentReference: string;
  method: string;
  notes: string;
  paidAmount: number;
}

export async function disburseAdvance(id: string, payload: DisburseAdvancePayload): Promise<unknown> {
  const { data } = await apiClient.post(`/advances/${id}/disburse`, payload);
  return data;
}

/** GET /api/advances/{id}/disburse/validate — checks remaining advance + balance cap (for follow-up disbursements). */
export interface AdvanceDisburseValidation {
  balanceCap: number;
  remainingOnAdvance: number;
  paidAmount: number;
  canDisburse: boolean;
  message: string | null;
}

export async function validateAdvanceDisburse(id: string, paidAmount: number): Promise<AdvanceDisburseValidation> {
  const { data } = await apiClient.get<AdvanceDisburseValidation>(`/advances/${id}/disburse/validate`, {
    params: { paidAmount },
  });
  return data;
}
