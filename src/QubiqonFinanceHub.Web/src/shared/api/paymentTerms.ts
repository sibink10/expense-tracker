import { apiClient } from "./client";

export interface PaymentTerm {
  id: string;
  name: string;
  shortName: string;
  days: number;
  isActive: boolean;
}

export interface CreatePaymentTermPayload {
  name: string;
  shortName: string;
  days: number;
}

export interface UpdatePaymentTermPayload {
  name: string;
  shortName: string;
  days: number;
  isActive: boolean;
}

export async function getPaymentTerms(): Promise<PaymentTerm[]> {
  const { data } = await apiClient.get<PaymentTerm[] | { items: PaymentTerm[] }>("/payment-terms");
  return Array.isArray(data) ? data : (data as { items: PaymentTerm[] })?.items ?? [];
}

export async function createPaymentTerm(payload: CreatePaymentTermPayload): Promise<PaymentTerm> {
  const { data } = await apiClient.post<PaymentTerm>("/payment-terms", payload);
  return data;
}

export async function updatePaymentTerm(id: string, payload: UpdatePaymentTermPayload): Promise<PaymentTerm> {
  const { data } = await apiClient.put<PaymentTerm>(`/payment-terms/${id}`, payload);
  return data;
}

export async function deletePaymentTerm(id: string): Promise<void> {
  await apiClient.delete(`/payment-terms/${id}`);
}

export async function togglePaymentTerm(id: string): Promise<void> {
  await apiClient.post(`/payment-terms/${id}/toggle`);
}
