import { apiClient } from "./client";
import type { Invoice, InvoiceItem } from "../../types";
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
  etc?: string;
}

export interface ApiInvoiceLineItem {
  description: string;
  hsnCode: string;
  quantity: number;
  rate: number;
  gstConfigId?: string;
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
  currency: string;
  lineItems?: ApiInvoiceLineItem[];
  subTotal?: number;
  taxAmount?: number;
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
}

const STATUS_MAP: Record<string, string> = {
  Draft: INV_S.DRAFT,
  Sent: INV_S.SENT,
  Viewed: INV_S.VIEWED,
  Paid: INV_S.PAID,
  PartiallyPaid: INV_S.PARTIALLY_PAID,
  Overdue: INV_S.OVERDUE,
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
  };
}

function mapApiInvoiceToApp(item: ApiInvoice): Invoice {
  const items: InvoiceItem[] = (item.lineItems ?? []).map(mapLineItem);
  const subTotal = item.subTotal ?? items.reduce((s, i) => s + i.qty * i.rate, 0);
  const taxAmt = item.taxAmount ?? items.reduce((s, i) => s + i.gstAmt, 0);
  const total = item.total ?? subTotal + taxAmt;
  return {
    id: item.invoiceCode ?? item.invoiceNumber ?? item.id,
    apiId: item.id,
    cId: item.clientId,
    cName: item.clientName ?? "",
    cEmail: item.clientEmail ?? "",
    currency: item.currency ?? "INR",
    items,
    subTotal,
    taxId: null,
    taxAmt,
    total,
    invDate: item.invoiceDate?.split("T")[0] ?? "",
    due: item.dueDate?.split("T")[0] ?? "",
    terms: item.paymentTerms ?? "",
    status: mapStatus(item.status),
    po: item.purchaseOrder ?? "",
    notes: item.notes ?? "",
    at: item.createdAt?.split("T")[0] ?? "",
    comments: (item.comments ?? []).map((c) => ({
      by: c.by,
      text: c.text,
      d: c.createdAt?.split("T")[0] ?? "",
      t: "ok" as const,
    })),
    paidRef: item.paymentReference ?? undefined,
    paidAmound: item.paidAmound ?? 0,
  };
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
}

export async function getInvoicesRaw(params: GetInvoicesParams = {}): Promise<ApiInvoicesResponse> {
  const apiParams: Record<string, unknown> = {
    Page: params.page,
    PageSize: params.pageSize,
    Search: params.search,
    Status: params.status,
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

export async function createInvoice(payload: CreateInvoicePayload): Promise<unknown> {
  const { data } = await apiClient.post("/invoices", payload);
  return data;
}

export interface MarkInvoicePaidPayload {
  paymentReference: string;
  paidAmound: number;
  method: string;
  notes: string;
}

export async function markInvoicePaid(id: string, payload: MarkInvoicePaidPayload): Promise<unknown> {
  const { data } = await apiClient.post(`/invoices/${id}/paid`, payload);
  return data;
}
