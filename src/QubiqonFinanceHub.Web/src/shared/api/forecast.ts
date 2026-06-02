import { apiClient } from "./client";
import type { ActivityComment, Forecast, ForecastSummary, UploadedDocument } from "../../types";
import {
  activityCommentStatusFallback,
  formatActivityCommentAction,
  mapActionTypeToAccentT,
} from "../activityCommentStatus";

export interface ApiForecastDocument {
  id: string;
  fileName: string;
  contentType?: string | null;
  fileSizeBytes: number;
  uploadedAt: string;
}

export interface ApiForecastComment {
  id: string;
  by: string;
  text: string;
  actionType: string;
  createdAt: string;
}

export interface ApiForecastExpense {
  id: string;
  expenseCode: string;
  amount: number;
  billDate: string;
  status: string;
  submittedBy: string;
  createdAt: string;
}

export interface ApiForecastItem {
  id: string;
  title: string;
  purpose: string;
  description: string;
  expectedAmount: number;
  expectedExpenseDate: string;
  notes?: string | null;
  status: string;
  createdByEmployeeId: string;
  createdBy: string;
  createdAt: string;
  expensesRaised: number;
  comments: ApiForecastComment[];
  documents: ApiForecastDocument[];
  relatedExpenses: ApiForecastExpense[];
}

export interface ApiForecastsResponse {
  items: ApiForecastItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
}

export interface GetForecastsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  desc?: boolean;
}

function formatFileSize(sizeBytes: number): string {
  if (!sizeBytes) return "0 KB";
  if (sizeBytes < 1024 * 1024) return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`;
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function mapDocument(doc: ApiForecastDocument): UploadedDocument {
  return {
    id: doc.id,
    name: doc.fileName,
    contentType: doc.contentType ?? undefined,
    sizeBytes: doc.fileSizeBytes,
    sizeLabel: formatFileSize(doc.fileSizeBytes),
    uploadedAt: doc.uploadedAt ? doc.uploadedAt.split("T")[0] : "",
  };
}

function mapComment(c: ApiForecastComment): ActivityComment {
  const t = mapActionTypeToAccentT(c.actionType);
  return {
    by: c.by,
    text: c.text,
    d: c.createdAt ? c.createdAt.split("T")[0] : "",
    t,
    status: formatActivityCommentAction(c.actionType) || activityCommentStatusFallback(t),
  };
}

export function mapForecast(item: ApiForecastItem): Forecast {
  return {
    id: item.id,
    title: item.title,
    purpose: item.purpose,
    description: item.description,
    expectedAmount: item.expectedAmount,
    expectedExpenseDate: item.expectedExpenseDate ? item.expectedExpenseDate.split("T")[0] : "",
    notes: item.notes,
    status: item.status,
    createdByEmployeeId: item.createdByEmployeeId,
    createdBy: item.createdBy,
    createdAt: item.createdAt ? item.createdAt.split("T")[0] : "",
    expensesRaised: item.expensesRaised,
    comments: (item.comments ?? []).map(mapComment),
    documents: (item.documents ?? []).map(mapDocument),
    relatedExpenses: (item.relatedExpenses ?? []).map((expense) => ({
      ...expense,
      billDate: expense.billDate ? expense.billDate.split("T")[0] : "",
      createdAt: expense.createdAt ? expense.createdAt.split("T")[0] : "",
    })),
  };
}

export async function getForecasts(params: GetForecastsParams = {}): Promise<ApiForecastsResponse> {
  const { data } = await apiClient.get<ApiForecastsResponse>("/forecasts", {
    params: {
      Page: params.page,
      PageSize: params.pageSize,
      Search: params.search,
      Status: params.status,
      SortBy: params.sortBy,
      Desc: params.desc,
    },
  });
  return data;
}

export async function getForecastsMapped(params: GetForecastsParams = {}) {
  const res = await getForecasts(params);
  return { ...res, items: res.items.map(mapForecast) };
}

export async function getForecastById(id: string): Promise<Forecast | null> {
  try {
    const { data } = await apiClient.get<ApiForecastItem>(`/forecasts/${id}`);
    return data ? mapForecast(data) : null;
  } catch {
    return null;
  }
}

export async function getApprovedForecasts(): Promise<ForecastSummary[]> {
  const { data } = await apiClient.get<ForecastSummary[]>("/forecasts/approved");
  return data.map((item) => ({
    ...item,
    expectedExpenseDate: item.expectedExpenseDate ? item.expectedExpenseDate.split("T")[0] : "",
  }));
}

export async function createForecastForm(formData: FormData): Promise<Forecast> {
  const { data } = await apiClient.post<ApiForecastItem>("/forecasts", formData);
  return mapForecast(data);
}

export async function updateForecastForm(id: string, formData: FormData): Promise<Forecast> {
  const { data } = await apiClient.put<ApiForecastItem>(`/forecasts/${id}`, formData);
  return mapForecast(data);
}

export async function submitForecast(id: string): Promise<Forecast> {
  const { data } = await apiClient.post<ApiForecastItem>(`/forecasts/${id}/submit`);
  return mapForecast(data);
}

export async function approveForecast(id: string, comments?: string): Promise<Forecast> {
  const { data } = await apiClient.post<ApiForecastItem>(`/forecasts/${id}/approve`, { comments });
  return mapForecast(data);
}

export async function rejectForecast(id: string, comments: string): Promise<Forecast> {
  const { data } = await apiClient.post<ApiForecastItem>(`/forecasts/${id}/reject`, { comments });
  return mapForecast(data);
}

export async function cancelForecast(id: string): Promise<Forecast> {
  const { data } = await apiClient.post<ApiForecastItem>(`/forecasts/${id}/cancel`);
  return mapForecast(data);
}

export async function getForecastDocument(id: string, documentId: string): Promise<string> {
  const { data } = await apiClient.get<{ url: string }>(`/forecasts/${id}/documents/${documentId}`);
  return data?.url ?? "";
}
