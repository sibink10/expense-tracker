import { apiClient } from "./client";
import type { Invoice, InvoiceItem } from "../../types";
import {
  activityCommentStatusFallback,
  formatActivityCommentAction,
  mapActionTypeToAccentT,
} from "../activityCommentStatus";
import { INV_S } from "../constants";

export interface CreateInvoiceLineItem {
  description: string;
  hsnCode: string;
  quantity: number;
  rate: number;
  gstConfigId: string | null;
}

export interface CreateInvoicePayload {
  clientId: string;
  currency: string;
  lineItems: CreateInvoiceLineItem[];
  taxConfigId: string | null;
  invoiceDate: string;
  dueDate: string;
  paymentTerms: string;
  purchaseOrder: string;
  notes: string;
  sendImmediately: boolean;
  invoiceNumber?: string;
}

export interface ApiInvoiceLineItem {
  description: string;
  hsnCode: string;
  quantity: number;
  rate: number;
  gstConfigId?: string | null;
  gstRate?: number;
  gstAmount?: number;
}

export interface ApiInvoice {
  id: string;
  invoiceCode?: string;
  invoiceNumber?: string;
  clientId: string;
  clientName?: string;
  clientEmail?: string;
  billTo?: string | null;
  shipTo?: string | null;
  currency: string;
  lineItems?: ApiInvoiceLineItem[];
  subTotal?: number;
  totalGST?: number;
  taxName?: string | null;
  taxAmount?: number;
  taxConfigId?: string | null;
  total: number;
  invoiceDate: string;
  dueDate: string;
  paymentTerms?: string;
  status: string;
  purchaseOrder?: string;
  notes?: string;
  createdAt?: string;
  comments?: { by: string; text: string; actionType?: string; createdAt?: string }[];
  paymentReference?: string | null;
  paidAmound?: number;
  zohoSignRequestId?: string | null;
  zohoSignStatus?: string | null;
  signatureRequestedAt?: string | null;
  signedPdfUrl?: string | null;
  signedAt?: string | null;
  organizationBankDetails?: {
    orgName: string;
    accountHolderName?: string | null;
    bankName?: string | null;
    ifscCode?: string | null;
    swiftCode?: string | null;
    accountNumber?: string | null;
    bankAddress?: string | null;
  } | null;
}

const STATUS_MAP: Record<string, string> = {
  Draft: INV_S.DRAFT,
  Sent: INV_S.SENT,
  Viewed: INV_S.VIEWED,
  Paid: INV_S.PAID,
  PartiallyPaid: INV_S.PARTIALLY_PAID,
  Overdue: INV_S.OVERDUE,
  PendingSignature: INV_S.PENDING_SIGNATURE,
  Signed: INV_S.SIGNED,
  SignatureFailed: INV_S.SIGNATURE_FAILED,
  Cancelled: INV_S.CANCELLED,
};

function mapStatus(s: string): string {
  return STATUS_MAP[s] ?? s;
}

function mapLineItem(it: ApiInvoiceLineItem): InvoiceItem {
  const amt = it.quantity * it.rate;
  const gstAmt = it.gstAmount ?? (it.gstRate != null ? (amt * it.gstRate) / 100 : 0);
  return {
    desc: it.description,
    hsn: it.hsnCode ?? "",
    qty: it.quantity,
    rate: it.rate,
    gst: it.gstRate != null ? `${it.gstRate}%` : "0%",
    gstAmt,
    gstConfigId: it.gstConfigId ?? null,
  };
}

function mapApiInvoiceToApp(item: ApiInvoice): Invoice {
  const items: InvoiceItem[] = (item.lineItems ?? []).map(mapLineItem);
  const subTotal = item.subTotal ?? items.reduce((s, i) => s + i.qty * i.rate, 0);
  const totalGst = item.totalGST ?? items.reduce((s, i) => s + i.gstAmt, 0);
  const taxAmt = item.taxAmount ?? 0;
  const total = item.total ?? subTotal + totalGst - taxAmt;
  return {
    id: item.invoiceCode ?? item.invoiceNumber ?? item.id,
    apiId: item.id,
    cId: item.clientId,
    cName: item.clientName ?? "",
    cEmail: item.clientEmail ?? "",
    billTo: item.billTo ?? undefined,
    shipTo: item.shipTo ?? undefined,
    currency: item.currency ?? "INR",
    items,
    subTotal,
    totalGst,
    taxId: null,
    taxConfigId: item.taxConfigId ?? null,
    taxName: item.taxName ?? null,
    taxAmt,
    total,
    invDate: item.invoiceDate?.split("T")[0] ?? "",
    due: item.dueDate?.split("T")[0] ?? "",
    terms: item.paymentTerms ?? "",
    status: mapStatus(item.status),
    po: item.purchaseOrder ?? "",
    notes: item.notes ?? "",
    at: item.createdAt?.split("T")[0] ?? "",
    comments: (item.comments ?? []).map((c) => {
      const t = mapActionTypeToAccentT(c.actionType ?? "");
      return {
        by: c.by,
        text: c.text,
        d: c.createdAt?.split("T")[0] ?? "",
        t,
        status: formatActivityCommentAction(c.actionType) || activityCommentStatusFallback(t),
      };
    }),
    paidRef: item.paymentReference ?? undefined,
    paidAmound: item.paidAmound ?? 0,
    zohoSignRequestId: item.zohoSignRequestId ?? null,
    zohoSignStatus: item.zohoSignStatus ?? null,
    signatureRequestedAt: item.signatureRequestedAt ?? null,
    signedPdfUrl: item.signedPdfUrl ?? null,
    signedAt: item.signedAt ?? null,
    organizationBankDetails: item.organizationBankDetails ?? null,
  };
}

export interface InvoiceZohoSignStatus {
  zohoRequestId?: string | null;
  zohoStatus?: string | null;
  invoiceStatus: string;
  signedPdfUrl?: string | null;
  canResend: boolean;
  canSyncToStorage: boolean;
  lastCheckedAt?: string;
  signerEmail?: string | null;
}

export async function getInvoiceZohoSignStatus(invoiceId: string, refresh = true): Promise<InvoiceZohoSignStatus> {
  const { data } = await apiClient.get<InvoiceZohoSignStatus>(
    `/invoices/${invoiceId}/zoho-sign/status`,
    { params: { refresh } },
  );
  return data;
}

export async function syncInvoiceSignedPdf(invoiceId: string): Promise<ApiInvoice> {
  const { data } = await apiClient.post<ApiInvoice>(`/invoices/${invoiceId}/zoho-sign/sync`);
  return data;
}

/** SAS URL for viewing/downloading the stored signed PDF (GET /api/invoices/{id}/signed-pdf). */
export async function getInvoiceSignedPdfUrl(invoiceId: string): Promise<string> {
  const { data } = await apiClient.get<{ url: string }>(`/invoices/${invoiceId}/signed-pdf`);
  return data?.url ?? "";
}

export interface ApiInvoicesResponse {
  items: ApiInvoice[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
}

export interface GetInvoicesParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  desc?: boolean;
}

/** Maps UI badge/status (`INV_S`) to ASP.NET `InvoiceStatus` enum name. */
export function invoiceStatusForApi(uiStatus: string): string {
  if (uiStatus === INV_S.PARTIALLY_PAID) return "PartiallyPaid";
  return uiStatus;
}

export interface InvoiceCounts {
  draft?: number;
  sent?: number;
  paid?: number;
  partiallyPaid?: number;
  overdue?: number;
}

export async function getInvoicesRaw(params: GetInvoicesParams = {}): Promise<ApiInvoicesResponse> {
  const apiParams: Record<string, unknown> = {
    Page: params.page,
    PageSize: params.pageSize,
    Search: params.search,
    Status: params.status ? invoiceStatusForApi(params.status) : undefined,
    SortBy: params.sortBy,
    Desc: params.desc,
  };

  const { data } = await apiClient.get<ApiInvoice[] | ApiInvoicesResponse>("/invoices", {
    params: apiParams,
  });

  if (Array.isArray(data)) {
    const items = data;
    return {
      items,
      totalCount: items.length,
      page: params.page ?? 1,
      pageSize: params.pageSize ?? (items.length || 10),
      totalPages: 1,
      hasNext: false,
    };
  }

  return data as ApiInvoicesResponse;
}

export async function getInvoices(params: GetInvoicesParams = {}): Promise<{
  items: Invoice[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
}> {
  const res = await getInvoicesRaw(params);
  return {
    ...res,
    items: res.items.map(mapApiInvoiceToApp),
  };
}

export async function getInvoiceCounts(): Promise<InvoiceCounts> {
  const { data } = await apiClient.get<InvoiceCounts>("/invoices/counts");
  return data ?? {};
}

export async function createInvoice(payload: CreateInvoicePayload): Promise<unknown> {
  const { data } = await apiClient.post("/invoices", payload);
  return data;
}

export interface UpdateInvoicePayload {
  invoiceCode: string;
  currency: string;
  lineItems: CreateInvoiceLineItem[];
  taxConfigId: string | null;
  invoiceDate: string;
  dueDate: string;
  paymentTerms: string;
  purchaseOrder: string;
  notes: string;
}

export async function getInvoice(id: string): Promise<Invoice | null> {
  try {
    const { data } = await apiClient.get<ApiInvoice>(`/invoices/${id}`);
    return data ? mapApiInvoiceToApp(data) : null;
  } catch {
    return null;
  }
}

export async function updateInvoice(id: string, payload: UpdateInvoicePayload): Promise<unknown> {
  const { data } = await apiClient.put(`/invoices/${id}`, {
    invoiceCode: payload.invoiceCode.trim(),
    currency: payload.currency,
    lineItems: payload.lineItems.map((li) => ({
      description: li.description,
      hsnCode: li.hsnCode || null,
      quantity: li.quantity,
      rate: li.rate,
      gstConfigId: li.gstConfigId || null,
    })),
    taxConfigId: payload.taxConfigId || null,
    invoiceDate: payload.invoiceDate,
    dueDate: payload.dueDate,
    paymentTerms: payload.paymentTerms,
    purchaseOrder: payload.purchaseOrder || null,
    notes: payload.notes || null,
  });
  return data;
}

export async function cancelInvoice(id: string): Promise<Invoice> {
  const { data } = await apiClient.post<ApiInvoice>(`/invoices/${id}/cancel`);
  return mapApiInvoiceToApp(data);
}

export interface MarkInvoicePaidPayload {
  paymentReference?: string | null;
  paidAmount: number;
  method: string;
  notes: string;
}

export async function markInvoicePaid(id: string, payload: MarkInvoicePaidPayload): Promise<unknown> {
  const { data } = await apiClient.post(`/invoices/${id}/paid`, payload);
  return data;
}

/** Mark draft invoice as Sent (notifies client by email). Finance/Admin only. */
export async function markInvoiceSent(id: string): Promise<Invoice> {
  const { data } = await apiClient.post<ApiInvoice>(`/invoices/${id}/send`);
  return mapApiInvoiceToApp(data);
}
