import { apiClient } from "./client";
import type { Client } from "../../types";

export interface ApiClient {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  country: string;
  currency: string;
  taxType: string | null;
  gstin: string;
  address?: string;
  customerType?: string;
  shippingAddress?: string;
  billingAddress?: string;
}

function mapApiClientToApp(item: ApiClient): Client {
  return {
    id: item.id,
    name: item.name,
    contact: item.contactPerson || "",
    email: item.email || "",
    phone: item.phone || "",
    country: item.country || "",
    currency: item.currency || "",
    addr: item.billingAddress ?? item.shippingAddress ?? item.address ?? "",
    gstin: item.gstin || "",
    taxType: item.taxType || "",
    customerType: item.customerType,
    shippingAddress: item.shippingAddress,
    billingAddress: item.billingAddress,
  };
}

export interface GetClientsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  desc?: boolean;
}

export interface PagedClientsResponse {
  items: Client[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
}

/** Paginated list with server sort (GET /api/clients). */
export async function getClientsPaged(params: GetClientsParams = {}): Promise<PagedClientsResponse> {
  const apiParams: Record<string, unknown> = {
    Page: params.page,
    PageSize: params.pageSize,
    Search: params.search,
    SortBy: params.sortBy,
    Desc: params.desc,
  };
  const { data } = await apiClient.get<
    ApiClient[] | { items: ApiClient[]; totalCount: number; page: number; pageSize: number; totalPages: number; hasNext: boolean }
  >("/clients", { params: apiParams });
  if (Array.isArray(data)) {
    const items = data.map(mapApiClientToApp);
    return {
      items,
      totalCount: items.length,
      page: params.page ?? 1,
      pageSize: params.pageSize || items.length || 10,
      totalPages: 1,
      hasNext: false,
    };
  }
  const dto = data as { items: ApiClient[]; totalCount: number; page: number; pageSize: number; totalPages: number; hasNext: boolean };
  const items = (dto.items ?? []).map(mapApiClientToApp);
  return {
    items,
    totalCount: dto.totalCount ?? items.length,
    page: dto.page ?? params.page ?? 1,
    pageSize: dto.pageSize ?? params.pageSize ?? 10,
    totalPages: dto.totalPages ?? 1,
    hasNext: dto.hasNext ?? false,
  };
}

/** @deprecated Prefer getClientsPaged for large directories; kept for simple dropdowns. */
export async function getClients(): Promise<Client[]> {
  const r = await getClientsPaged({ page: 1, pageSize: 500 });
  return r.items;
}

export interface ClientPayload {
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  country: string;
  currency: string;
  taxType: string | null;
  gstin: string;
  shippingAddress: string;
  billingAddress: string;
  customerType: string;
}

export async function createClient(payload: ClientPayload): Promise<unknown> {
  const { data } = await apiClient.post("/clients", payload);
  return data;
}

export async function updateClient(id: string, payload: ClientPayload): Promise<unknown> {
  const { data } = await apiClient.put(`/clients/${id}`, payload);
  return data;
}
