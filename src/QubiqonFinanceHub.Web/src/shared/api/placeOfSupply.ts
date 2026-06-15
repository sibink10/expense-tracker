import { apiClient } from "./client";

export interface PlaceOfSupplyItem {
  code: string;
  name: string;
  countryCode: string;
  countryName: string;
  isUnionTerritory: boolean;
}

export interface PagedPlaceOfSupplyResponse {
  items: PlaceOfSupplyItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
}

export interface GetPlaceOfSupplyParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  desc?: boolean;
}

export interface CreatePlaceOfSupplyPayload {
  code: string;
  name: string;
  countryCode: string;
  countryName: string;
  isUnionTerritory: boolean;
}

export interface UpdatePlaceOfSupplyPayload {
  name: string;
  countryCode: string;
  countryName: string;
  isUnionTerritory: boolean;
}

export async function getPlaceOfSupplyPaged(params: GetPlaceOfSupplyParams = {}): Promise<PagedPlaceOfSupplyResponse> {
  const { data } = await apiClient.get<PagedPlaceOfSupplyResponse>("/place-of-supply", {
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
      code: (item as { code?: string; placeOfSupplyCode?: string }).code
        ?? (item as { placeOfSupplyCode?: string }).placeOfSupplyCode
        ?? "",
      name: (item as { name?: string; placeOfSupplyName?: string }).name
        ?? (item as { placeOfSupplyName?: string }).placeOfSupplyName
        ?? "",
      countryCode: item.countryCode,
      countryName: item.countryName,
      isUnionTerritory: item.isUnionTerritory,
    })),
    totalCount: data.totalCount ?? 0,
    page: data.page ?? params.page ?? 1,
    pageSize: data.pageSize ?? params.pageSize ?? 10,
    totalPages: data.totalPages ?? 1,
    hasNext: data.hasNext ?? false,
  };
}

export async function createPlaceOfSupply(payload: CreatePlaceOfSupplyPayload): Promise<PlaceOfSupplyItem> {
  const { data } = await apiClient.post<PlaceOfSupplyItem>("/place-of-supply", payload);
  return data;
}

export async function updatePlaceOfSupply(code: string, payload: UpdatePlaceOfSupplyPayload): Promise<PlaceOfSupplyItem> {
  const { data } = await apiClient.put<PlaceOfSupplyItem>(`/place-of-supply/${encodeURIComponent(code)}`, payload);
  return data;
}

export async function deletePlaceOfSupply(code: string): Promise<void> {
  await apiClient.delete(`/place-of-supply/${encodeURIComponent(code)}`);
}
