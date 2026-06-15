import { apiClient } from "./client";

export interface PaymentTerm {
  id: string;
  name: string;
  shortName: string;
  days: number;
  isActive: boolean;
  description?: string | null;
}

export interface PagedPaymentTermsResponse {
  items: PaymentTerm[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
}

export interface GetPaymentTermsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  desc?: boolean;
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

export async function getPaymentTermsPaged(params: GetPaymentTermsParams = {}): Promise<PagedPaymentTermsResponse> {
  const { data } = await apiClient.get<PagedPaymentTermsResponse>("/payment-terms", {
    params: {
      Page: params.page,
      PageSize: params.pageSize,
      Search: params.search,
      SortBy: params.sortBy,
      Desc: params.desc,
    },
  });
  return {
    items: data.items ?? [],
    totalCount: data.totalCount ?? 0,
    page: data.page ?? params.page ?? 1,
    pageSize: data.pageSize ?? params.pageSize ?? 10,
    totalPages: data.totalPages ?? 1,
    hasNext: data.hasNext ?? false,
  };
}

/** @deprecated Use getPaymentTermsPaged for admin list pages. */
export async function getPaymentTerms(): Promise<PaymentTerm[]> {
  const r = await getPaymentTermsPaged({ page: 1, pageSize: 500 });
  return r.items;
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
