import { apiClient } from "./client";

export interface Account {
  id: string;
  name: string;
  shortName: string;
  isActive: boolean;
}

export interface CreateAccountPayload {
  name: string;
  shortName: string;
}

export interface UpdateAccountPayload {
  name: string;
  shortName: string;
  isActive: boolean;
}

export async function getAccounts(): Promise<Account[]> {
  const { data } = await apiClient.get<Account[] | { items: Account[] }>("/accounts");
  return Array.isArray(data) ? data : (data as { items: Account[] })?.items ?? [];
}

export async function createAccount(payload: CreateAccountPayload): Promise<Account> {
  const { data } = await apiClient.post<Account>("/accounts", payload);
  return data;
}

export async function updateAccount(id: string, payload: UpdateAccountPayload): Promise<Account> {
  const { data } = await apiClient.put<Account>(`/accounts/${id}`, payload);
  return data;
}

export async function deleteAccount(id: string): Promise<void> {
  await apiClient.delete(`/accounts/${id}`);
}

export async function toggleAccount(id: string): Promise<void> {
  await apiClient.post(`/accounts/${id}/toggle`);
}
