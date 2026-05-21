import { apiClient } from "./client";

export type ZohoSignDocumentType = "Invoice";

export interface ZohoIntegrationSetup {
  title?: string;
  clientId?: string;
  scope?: string;
  dataCenter?: string;
  homePage?: string;
  isConfigured: boolean;
  accessToken?: string;
  tokenError?: string;
  authorizationUrl?: string;
}

export interface ZohoSignSendResult {
  code?: number;
  message?: string;
  requestId?: string;
  rawJson?: string;
}

export interface ZohoSignSendPayload {
  type: ZohoSignDocumentType;
  sourceId: string;
  templateId?: string;
  notes?: string;
}

export interface ZohoSignRequestsParams {
  rowCount?: number;
  startIndex?: number;
  templateName?: string;
  sortColumn?: string;
  sortOrder?: string;
}

export async function getZohoIntegrationSetup(): Promise<ZohoIntegrationSetup> {
  const { data } = await apiClient.get<ZohoIntegrationSetup>("/zoho/integration-setup");
  return data;
}

export async function getZohoTemplates(): Promise<unknown> {
  const { data } = await apiClient.get("/zoho/sign/templates");
  return data;
}

export async function getZohoTemplate(templateId: string): Promise<unknown> {
  const { data } = await apiClient.get(`/zoho/sign/templates/${encodeURIComponent(templateId)}`);
  return data;
}

export async function getZohoSignRequests(params: ZohoSignRequestsParams = {}): Promise<unknown> {
  const { data } = await apiClient.get("/zoho/sign/requests", { params });
  return data;
}

export async function getZohoSignRequest(requestId: string): Promise<unknown> {
  const { data } = await apiClient.get(`/zoho/sign/requests/${encodeURIComponent(requestId)}`);
  return data;
}

export async function downloadZohoSignPdf(requestId: string): Promise<Blob> {
  const { data } = await apiClient.get(
    `/zoho/sign/requests/${encodeURIComponent(requestId)}/pdf`,
    { responseType: "blob" }
  );
  return data as Blob;
}

export async function sendZohoDocument(payload: ZohoSignSendPayload): Promise<ZohoSignSendResult> {
  const { data } = await apiClient.post<ZohoSignSendResult>("/zoho/sign/send", {
    type: 1, // ZohoSignDocumentType.Invoice
    sourceId: payload.sourceId,
    templateId: payload.templateId ?? "",
    notes: payload.notes,
  });
  return data;
}

/** Extract template rows from Zoho Sign list response (shape varies). */
export function parseZohoTemplates(data: unknown): { id: string; name: string }[] {
  const root = data as Record<string, unknown>;
  const list =
    (root?.templates as unknown[]) ??
    ((root?.data as Record<string, unknown>)?.templates as unknown[]) ??
    [];

  if (!Array.isArray(list)) return [];

  return list
    .map((item) => {
      const t = item as Record<string, unknown>;
      const id = String(t.template_id ?? t.templateId ?? t.id ?? "");
      const name = String(t.template_name ?? t.templateName ?? t.name ?? id);
      return id ? { id, name } : null;
    })
    .filter((x): x is { id: string; name: string } => x != null);
}

/** Extract sign request rows from Zoho list response. */
export function parseZohoSignRequests(data: unknown): {
  id: string;
  name: string;
  status: string;
  createdTime?: string;
}[] {
  const root = data as Record<string, unknown>;
  const list =
    (root?.requests as unknown[]) ??
    ((root?.data as Record<string, unknown>)?.requests as unknown[]) ??
    [];

  if (!Array.isArray(list)) return [];

  const rows: { id: string; name: string; status: string; createdTime?: string }[] = [];
  for (const item of list) {
    const r = item as Record<string, unknown>;
    const id = String(r.request_id ?? r.requestId ?? r.id ?? "");
    if (!id) continue;
    rows.push({
      id,
      name: String(r.request_name ?? r.requestName ?? r.name ?? id),
      status: String(r.request_status ?? r.status ?? "—"),
      createdTime: r.created_time != null ? String(r.created_time) : undefined,
    });
  }
  return rows;
}
