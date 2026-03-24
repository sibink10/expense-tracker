import { apiClient } from "./client";
import type { Expense } from "../../types";
import type { ActivityComment, FileRef, UploadedDocument } from "../../types";
import { EXP_S } from "../constants";

// ─── API types ─────────────────────────────────────────────────
export interface ApiExpenseComment {
  id: string;
  by: string;
  text: string;
  actionType: string;
  createdAt: string;
}

export interface ApiExpenseDocument {
  id: string;
  fileName: string;
  contentType?: string | null;
  fileSizeBytes: number;
  uploadedAt: string;
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
  documents?: ApiExpenseDocument[];
  billNumber?: string | null;
  billDate?: string | null;
  paidAmount?: number;
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
  PendingBillApproval: EXP_S.PENDING_BILL_APPROVAL,
  Approved: EXP_S.APPROVED,
  AwaitingPayment: EXP_S.AWAITING_PAYMENT,
  Rejected: EXP_S.REJECTED,
  Cancelled: EXP_S.CANCELLED,
  AwaitingBill: EXP_S.AWAITING_BILL,
  Completed: EXP_S.COMPLETED,
  PartiallyPaid: EXP_S.PARTIALLY_PAID,
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

function formatFileSize(sizeBytes: number): string {
  if (!sizeBytes) return "0 KB";
  if (sizeBytes < 1024 * 1024) return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`;
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function mapApiDocument(doc: ApiExpenseDocument): UploadedDocument {
  return {
    id: doc.id,
    name: doc.fileName,
    contentType: doc.contentType ?? undefined,
    sizeBytes: doc.fileSizeBytes,
    sizeLabel: formatFileSize(doc.fileSizeBytes),
    uploadedAt: doc.uploadedAt ? doc.uploadedAt.split("T")[0] : "",
  };
}

function mapApiExpenseToApp(item: ApiExpenseItem): Expense {
  const status = STATUS_MAP[item.status] ?? item.status;
  const documents = (item.documents ?? []).map(mapApiDocument);
  const primaryDocument = documents[documents.length - 1];
  const file: FileRef | null = primaryDocument
    ? { n: primaryDocument.name, s: primaryDocument.sizeLabel }
    : item.attachmentUrl
      ? { n: item.attachmentUrl.split("/").pop() || "file", s: "—" }
      : null;
  const billDate = item.billDate ? (item.billDate.includes("T") ? item.billDate.split("T")[0] : item.billDate) : undefined;
  return {
    id: item.expenseCode,
    apiId: item.id,
    employeeId: item.employeeId,
    empId: 0,
    empName: item.employeeName,
    dept: item.department || "",
    amt: item.amount,
    purpose: item.purpose,
    reqBy: item.requiredByDate ? item.requiredByDate.split("T")[0] : "",
    status,
    at: item.createdAt ? item.createdAt.split("T")[0] : "",
    file,
    attachmentUrl: item.attachmentUrl ?? undefined,
    documents,
    billNumber: item.billNumber ?? undefined,
    billDate,
    paidAmount: item.paidAmount ?? 0,
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
  /** API `FilterParams.SortBy` (e.g. CreatedAt, Amount, ExpenseCode). */
  sortBy?: string;
  /** API `FilterParams.Desc` */
  desc?: boolean;
}

export async function getExpenses(params: GetExpensesParams = {}): Promise<ApiExpensesResponse> {
  const apiParams = {
    Page: params.page,
    PageSize: params.pageSize,
    Search: params.search,
    Status: params.status,
    SortBy: params.sortBy,
    Desc: params.desc,
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

/** GET /api/expenses/{id} — same shape as list items for mapping. */
export async function getExpenseById(id: string): Promise<Expense | null> {
  try {
    const { data } = await apiClient.get<ApiExpenseItem>(`/expenses/${id}`);
    return data ? mapApiExpenseToApp(data) : null;
  } catch {
    return null;
  }
}

export interface ExpenseCounts {
  pendExp: number;
  payableCount: number;
}

export interface CreateExpensePayload {
  amount: number;
  purpose: string;
  requiredByDate?: string;
  onBehalfOfEmployeeId: string | null;
  billNumber?: string | null;
  billDate?: string | null;
}

/** Submit expense with file attachment via FormData (multipart/form-data). */
export async function createExpenseForm(formData: FormData): Promise<unknown> {
  const { data } = await apiClient.post("/expenses", formData);
  return data;
}

export async function approveExpense(id: string, comments?: string): Promise<unknown> {
  const { data } = await apiClient.post(`/expenses/${id}/approve`, { comments });
  return data;
}

export async function rejectExpense(id: string, comments: string): Promise<unknown> {
  const { data } = await apiClient.post(`/expenses/${id}/reject`, { comments });
  return data;
}

/** Submitter or admin cancels a pending expense (POST /api/expenses/{id}/cancel). */
export async function cancelExpense(id: string): Promise<unknown> {
  const { data } = await apiClient.post(`/expenses/${id}/cancel`);
  return data;
}

/** Mark expense as paid (POST /api/expenses/{id}/pay). */
export async function payExpense(id: string, payload: { paymentReference: string; paidAmount: number }): Promise<unknown> {
  const { data } = await apiClient.post(`/expenses/${id}/pay`, payload);
  return data;
}

export interface UpdateExpensePayload {
  amount?: number;
  purpose?: string;
  billNumber?: string;
  billDate?: string;
}

/** Update expense via PUT /api/expenses/{id} with FormData: Amount, Purpose, BillDate, BillNumber, optional BillImage. */
export async function updateExpenseForm(id: string, formData: FormData): Promise<unknown> {
  const { data } = await apiClient.put(`/expenses/${id}`, formData);
  return data;
}

/** Upload bill document for expense after submission/approval. */
export async function uploadExpenseBill(id: string, formData: FormData): Promise<unknown> {
  const { data } = await apiClient.post(`/expenses/${id}/upload-bill`, formData);
  return data;
}

/** Response from GET /api/expenses/{id}/bill. */
export interface GetExpenseBillResponse {
  url: string;
}

/** Get bill view URL (GET /api/expenses/{id}/bill). Returns signed URL for viewing in iframe. */
export async function getExpenseBill(id: string): Promise<string> {
  const { data } = await apiClient.get<GetExpenseBillResponse>(`/expenses/${id}/bill`);
  return data?.url ?? "";
}

export async function getExpenseDocument(id: string, documentId: string): Promise<string> {
  const { data } = await apiClient.get<GetExpenseBillResponse>(`/expenses/${id}/documents/${documentId}`);
  return data?.url ?? "";
}

/** Remove a document from an expense (DELETE /api/expenses/{id}/documents/{documentId}). */
export async function removeExpenseDocument(id: string, documentId: string): Promise<void> {
  await apiClient.delete(`/expenses/${id}/documents/${documentId}`);
}

/** Get bill as blob for download (GET /api/expenses/{id}/bill/download). Use this to avoid CORS when downloading. */
export async function getExpenseBillBlob(id: string): Promise<string> {
  const { data } = await apiClient.get(`/expenses/${id}/bill`);
  return data?.url || "";
}

/** Lightweight fetch for counts (Dashboard, nav badges). */
export async function getExpenseCounts(): Promise<ExpenseCounts> {
  try {
    const [pendingRes, approvedRes] = await Promise.all([
      getExpenses({ page: 1, pageSize: 1, status: "PendingApproval" }),
      getExpenses({ page: 1, pageSize: 1, status: "AwaitingPayment" }),
    ]);
    return {
      pendExp: pendingRes.totalCount ?? 0,
      payableCount: approvedRes.totalCount ?? 0,
    };
  } catch {
    return { pendExp: 0, payableCount: 0 };
  }
}
