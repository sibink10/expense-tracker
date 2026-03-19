import { apiClient } from "./client";
import type { TaxConfig } from "../../types";

export interface ApiTaxConfig {
  id: string;
  type: string;
  name: string;
  rate: number;
  section: string;
  subType?: string;
  isActive?: boolean;
}

function mapApiTaxConfigToApp(item: ApiTaxConfig): TaxConfig {
  return {
    id: item.id,
    name: item.name,
    rate: item.rate,
    section: item.section,
    isActive: item.isActive ?? false,
    type: item.type,
    subType: item.subType,
  };
}

export async function getTaxConfigs(): Promise<TaxConfig[]> {
  const { data } = await apiClient.get<ApiTaxConfig[] | { items: ApiTaxConfig[] }>("/tax-config");
  const items = Array.isArray(data) ? data : (data as { items: ApiTaxConfig[] })?.items ?? [];
  return items.map(mapApiTaxConfigToApp);
}

export interface CreateTaxConfigPayload {
  type: string;
  name: string;
  rate: number;
  section: string;
  subType: string;
}

export async function createTaxConfig(payload: CreateTaxConfigPayload): Promise<unknown> {
  const { data } = await apiClient.post("/tax-config", payload);
  return data;
}

export async function toggleTaxConfig(id: string): Promise<unknown> {
  const { data } = await apiClient.post(`/tax-config/${id}/toggle`);
  return data;
}

export interface UpdateTaxConfigPayload {
  type: string;
  name: string;
  rate: number;
  section: string;
  subType: string;
}

export async function updateTaxConfig(id: string, payload: UpdateTaxConfigPayload): Promise<unknown> {
  const { data } = await apiClient.put(`/tax-config/${id}`, payload);
  return data;
}
