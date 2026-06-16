import { apiClient } from "./client";

export interface GstTreatment {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  showGstin: boolean;
  showPlaceOfSupply: boolean;
  showTaxPreference: boolean;
  showPan: boolean;
  showBusinessLegalName: boolean;
  showBusinessTradeName: boolean;
}

export interface PagedGstTreatmentsResponse {
  items: GstTreatment[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
}

export interface GetGstTreatmentsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  desc?: boolean;
}

export interface CreateGstTreatmentPayload {
  code: string;
  name: string;
  description?: string | null;
  showGstin?: boolean;
  showPlaceOfSupply?: boolean;
  showTaxPreference?: boolean;
  showPan?: boolean;
  showBusinessLegalName?: boolean;
  showBusinessTradeName?: boolean;
}

export interface UpdateGstTreatmentPayload {
  code: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  showGstin: boolean;
  showPlaceOfSupply: boolean;
  showTaxPreference: boolean;
  showPan: boolean;
  showBusinessLegalName: boolean;
  showBusinessTradeName: boolean;
}

export async function getGstTreatmentsPaged(params: GetGstTreatmentsParams = {}): Promise<PagedGstTreatmentsResponse> {
  const { data } = await apiClient.get<PagedGstTreatmentsResponse>("/gst-treatments", {
    params: {
      Page: params.page,
      PageSize: params.pageSize,
      Search: params.search,
      SortBy: params.sortBy,
      Desc: params.desc,
    },
  });
  return {
    items: (data.items ?? []).map((item) => ({
      ...item,
      showGstin: item.showGstin ?? true,
      showPlaceOfSupply: item.showPlaceOfSupply ?? true,
      showTaxPreference: item.showTaxPreference ?? true,
      showPan: item.showPan ?? true,
      showBusinessLegalName: item.showBusinessLegalName ?? false,
      showBusinessTradeName: item.showBusinessTradeName ?? false,
    })),
    totalCount: data.totalCount ?? 0,
    page: data.page ?? params.page ?? 1,
    pageSize: data.pageSize ?? params.pageSize ?? 10,
    totalPages: data.totalPages ?? 1,
    hasNext: data.hasNext ?? false,
  };
}

export async function createGstTreatment(payload: CreateGstTreatmentPayload): Promise<GstTreatment> {
  const { data } = await apiClient.post<GstTreatment>("/gst-treatments", payload);
  return data;
}

export async function updateGstTreatment(id: string, payload: UpdateGstTreatmentPayload): Promise<GstTreatment> {
  const { data } = await apiClient.put<GstTreatment>(`/gst-treatments/${id}`, payload);
  return data;
}

export async function toggleGstTreatment(id: string): Promise<GstTreatment> {
  const { data } = await apiClient.post<GstTreatment>(`/gst-treatments/${id}/toggle`);
  return data;
}
