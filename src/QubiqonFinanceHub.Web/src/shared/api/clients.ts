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

export async function getClients(): Promise<Client[]> {
  const { data } = await apiClient.get<ApiClient[] | { items: ApiClient[] }>("/clients");
  const items = Array.isArray(data) ? data : (data as { items: ApiClient[] })?.items ?? [];
  return items.map(mapApiClientToApp);
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
