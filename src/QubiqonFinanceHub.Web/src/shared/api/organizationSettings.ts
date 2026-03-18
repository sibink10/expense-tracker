import { apiClient } from "./client";

export interface OrganizationSettingItem {
  id: string | null;
  value: string;
}

export type OrganizationSettingsResponse = Record<string, OrganizationSettingItem>;

export interface BulkSettingItem {
  id: string | null;
  key: string;
  value: string;
}

export async function getOrganizationSettings(): Promise<OrganizationSettingsResponse> {
  const { data } = await apiClient.get<OrganizationSettingsResponse>("/settings/organization");
  return data ?? {};
}

export async function bulkUpsertOrganizationSettings(items: BulkSettingItem[]): Promise<void> {
  await apiClient.post("/settings/organization/bulk", items);
}

