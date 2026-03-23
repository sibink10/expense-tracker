import { apiClient } from "./client";
import type { Vendor } from "../../types";

export interface ApiVendor {
  id: string;
  name: string;
  gstin: string;
  email: string;
  phone: string;
  category: string;
  address: string;
  contactPerson?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
}

function mapApiVendorToApp(item: ApiVendor): Vendor {
  return {
    id: item.id,
    name: item.name,
    gstin: item.gstin || "",
    email: item.email || "",
    cat: item.category || "",
    ph: item.phone || "",
    addr: item.address || "",
    contactPerson: item.contactPerson ?? undefined,
    bankName: item.bankName ?? undefined,
    accountNumber: item.accountNumber ?? undefined,
    ifscCode: item.ifscCode ?? undefined,
  };
}

export interface PagedVendorsResponse {
  items: Vendor[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
}

export async function getVendors(
  page = 1,
  pageSize = 10,
  search?: string,
  sortBy?: string,
  desc?: boolean
): Promise<PagedVendorsResponse> {
  const params: Record<string, string | number | boolean> = { page, pageSize };
  if (search?.trim()) params.search = search.trim();
  if (sortBy) params.SortBy = sortBy;
  if (desc !== undefined) params.Desc = desc;

  const { data } = await apiClient.get<
    ApiVendor[] | { items: ApiVendor[]; totalCount: number; page: number; pageSize: number; totalPages: number; hasNext: boolean }
  >("/vendors", { params });

  if (Array.isArray(data)) {
    const items = data.map(mapApiVendorToApp);
    return {
      items,
      totalCount: items.length,
      page,
      pageSize,
      totalPages: 1,
      hasNext: false,
    };
  }

  const dto = data as { items: ApiVendor[]; totalCount: number; page: number; pageSize: number; totalPages: number; hasNext: boolean };
  return {
    items: (dto.items ?? []).map(mapApiVendorToApp),
    totalCount: dto.totalCount ?? dto.items.length,
    page: dto.page ?? page,
    pageSize: dto.pageSize ?? pageSize,
    totalPages: dto.totalPages ?? 1,
    hasNext: dto.hasNext ?? false,
  };
}

export interface CreateVendorPayload {
  name: string;
  gstin: string;
  email: string;
  phone: string;
  category: string;
  address: string;
  contactPerson?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
}

export async function createVendor(payload: CreateVendorPayload): Promise<unknown> {
  const { data } = await apiClient.post("/vendors", payload);
  return data;
}

export type UpdateVendorPayload = CreateVendorPayload;

export async function updateVendor(id: string, payload: UpdateVendorPayload): Promise<unknown> {
  const { data } = await apiClient.put(`/vendors/${id}`, payload);
  return data;
}
