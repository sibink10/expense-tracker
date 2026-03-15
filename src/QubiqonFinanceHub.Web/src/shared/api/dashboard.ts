import { apiClient } from "./client";

export interface DashboardData {
  pendingExpenses?: number;
  approvedExpenses?: number;
  completedExpenses?: number;
  pendingBills?: number;
  billsToPayCount?: number;
  billsToPayAmount?: number;
  pendingAdvances?: number;
  draftInvoices?: number;
  sentInvoices?: number;
  paidInvoices?: number;
  overdueInvoices?: number;
  totalReceivable?: number;
  [key: string]: unknown;
}

export async function getDashboard(myOnly = true): Promise<DashboardData> {
  const { data } = await apiClient.get<DashboardData>("/dashboard", {
    params: { myOnly },
  });
  return data ?? {};
}
