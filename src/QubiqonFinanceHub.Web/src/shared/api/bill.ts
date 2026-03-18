import { apiClient } from "./client";
import type { Bill } from "../../types";
import type { UploadedDocument } from "../../types";

export interface ApiBill {
  id: string;
  billCode?: string;
  vendorBillNumber?: string;
  vendorId: string;
  vendorName?: string;
  vendorGstin?: string;
  vendorEmail?: string;
  amount: number;
  taxConfigId?: string;
  tdsAmount?: number;
  payableAmount?: number;
  description: string;
  billDate: string;
  dueDate: string;
  paymentTerms: string;
  status: string;
  attachmentUrl?: string | null;
  documents?: ApiBillDocument[];
  submittedBy?: string;
  submittedAt?: string;
  comments?: { by: string; text: string; actionType: string; createdAt: string }[];
  ccEmails?: string[];
  paymentReference?: string | null;
}

export interface ApiBillDocument {
  id: string;
  fileName: string;
  contentType?: string | null;
  fileSizeBytes: number;
  uploadedAt: string;
}

function mapStatus(s: string): string {
  const m: Record<string, string> = {
    Submitted: "Submitted",
    Approved: "Approved",
    Rejected: "Rejected",
    Paid: "Paid",
    Overdue: "Overdue",
  };
  return m[s] ?? s;
}

function formatFileSize(sizeBytes: number): string {
  if (!sizeBytes) return "0 KB";
  if (sizeBytes < 1024 * 1024) return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`;
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function mapDocument(doc: ApiBillDocument): UploadedDocument {
  return {
    id: doc.id,
    name: doc.fileName,
    contentType: doc.contentType ?? undefined,
    sizeBytes: doc.fileSizeBytes,
    sizeLabel: formatFileSize(doc.fileSizeBytes),
    uploadedAt: doc.uploadedAt?.split("T")[0] ?? "",
  };
}

function mapApiBillToApp(item: ApiBill): Bill {
  const pay = item.payableAmount ?? item.amount - (item.tdsAmount ?? 0);
  const documents = (item.documents ?? []).map(mapDocument);
  const primaryDocument = documents[documents.length - 1];
  const file = primaryDocument
    ? { n: primaryDocument.name, s: primaryDocument.sizeLabel }
    : item.attachmentUrl
      ? { n: item.attachmentUrl.split("/").pop() || "file", s: "—" }
      : null;
  return {
    id: item.billCode ?? item.id,
    apiId: item.id,
    vendorBillNumber: item.vendorBillNumber ?? undefined,
    vId: item.vendorId,
    vName: item.vendorName ?? "",
    vGst: item.vendorGstin ?? "",
    vEmail: item.vendorEmail ?? "",
    amt: item.amount,
    tds: item.taxConfigId ?? "",
    tdsAmt: item.tdsAmount ?? 0,
    pay,
    desc: item.description,
    bDate: item.billDate?.split("T")[0] ?? "",
    due: item.dueDate?.split("T")[0] ?? "",
    terms: item.paymentTerms ?? "",
    status: mapStatus(item.status),
    file,
    documents,
    by: 0,
    byName: item.submittedBy ?? "",
    at: item.submittedAt?.split("T")[0] ?? "",
    comments: (item.comments ?? []).map((c) => ({
      by: c.by,
      text: c.text,
      d: c.createdAt?.split("T")[0] ?? "",
      t: "ok" as const,
    })),
    cc: item.ccEmails,
    paidRef: item.paymentReference ?? undefined,
  };
}

export interface ApiBillsResponse {
  items: ApiBill[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
}

export interface GetBillsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}

export async function getBillsRaw(params: GetBillsParams = {}): Promise<ApiBillsResponse> {
  const apiParams: Record<string, unknown> = {
    Page: params.page,
    PageSize: params.pageSize,
    Search: params.search,
    Status: params.status,
  };

  const { data } = await apiClient.get<ApiBill[] | ApiBillsResponse>("/bills", {
    params: apiParams,
  });

  if (Array.isArray(data)) {
    const items = data;
    return {
      items,
      totalCount: items.length,
      page: params.page ?? 1,
      pageSize: params.pageSize || items.length || 10,
      totalPages: 1,
      hasNext: false,
    };
  }

  return data as ApiBillsResponse;
}

export async function getBills(params: GetBillsParams = {}): Promise<{
  items: Bill[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
}> {
  const res = await getBillsRaw(params);
  return {
    ...res,
    items: res.items.map(mapApiBillToApp),
  };
}

export interface CreateBillPayload {
  vendorId: string;
  vendorBillNumber: string;
  amount: number;
  taxConfigId: string;
  description: string;
  billDate: string;
  dueDate: string;
  paymentTerms: string;
  ccEmails: string;
}

export async function createBill(payload: CreateBillPayload, files: File[]): Promise<unknown> {
  const form = new FormData();
  form.append("vendorId", payload.vendorId);
  form.append("vendorBillNumber", payload.vendorBillNumber);
  form.append("amount", String(payload.amount));
  form.append("taxConfigId", payload.taxConfigId || "");
  form.append("description", payload.description);
  form.append("billDate", payload.billDate);
  form.append("dueDate", payload.dueDate);
  form.append("paymentTerms", payload.paymentTerms);
  form.append("ccEmails", payload.ccEmails);
  files.forEach((file) => form.append("attachments", file));

  const { data } = await apiClient.post("/bills", form);
  return data;
}

export async function approveBill(id: string, comments?: string): Promise<unknown> {
  const { data } = await apiClient.post(`/bills/${id}/approve`, { comments });
  return data;
}

export async function rejectBill(id: string, comments: string): Promise<unknown> {
  const { data } = await apiClient.post(`/bills/${id}/reject`, { comments });
  return data;
}

export async function payBill(id: string, paymentReference: string): Promise<unknown> {
  const { data } = await apiClient.post(`/bills/${id}/pay`, { paymentReference });
  return data;
}

/** Response from GET /api/bills/{id}/attachment. */
export interface GetBillAttachmentResponse {
  url: string;
}

/** Get bill attachment URL (GET /api/bills/{id}/attachment). Returns signed URL for viewing in iframe. */
export async function getBillAttachment(id: string): Promise<string> {
  const { data } = await apiClient.get<GetBillAttachmentResponse>(`/bills/${id}/attachment`);
  return data?.url ?? "";
}

export async function getBillDocument(id: string, documentId: string): Promise<string> {
  const { data } = await apiClient.get<GetBillAttachmentResponse>(`/bills/${id}/documents/${documentId}`);
  return data?.url ?? "";
}

/** Get bill attachment as blob for download (GET /api/bills/{id}/attachment with blob response). Same as expense: backend returns file to avoid CORS. */
export async function getBillAttachmentBlob(id: string): Promise<Blob> {
  const { data } = await apiClient.get(`/bills/${id}/attachment`, { responseType: "blob" });
  return data;
}
