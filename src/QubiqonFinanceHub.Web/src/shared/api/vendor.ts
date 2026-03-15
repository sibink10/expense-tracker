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
  };
}

export async function getVendors(): Promise<Vendor[]> {
  const { data } = await apiClient.get<ApiVendor[] | { items: ApiVendor[] }>("/vendors");
  const items = Array.isArray(data) ? data : (data as { items: ApiVendor[] })?.items ?? [];
  return items.map(mapApiVendorToApp);
}

export interface CreateVendorPayload {
  name: string;
  gstin: string;
  email: string;
  phone: string;
  category: string;
  address: string;
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
