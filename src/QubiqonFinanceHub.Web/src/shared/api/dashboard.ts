import { apiClient } from "./client";

/** Matches API `DashboardSliceDto` (camelCase JSON). */
export interface DashboardSlice {
  label: string;
  value: number;
  currency?: string | null;
}

/** Matches API `InvoiceStatusCountsDto`. */
export interface InvoiceStatusCounts {
  draft: number;
  sent: number;
  partiallyPaid: number;
  paid: number;
  overdue: number;
}

export interface DashboardData {
  pendingSubmittedBills: number;
  billsToPayCount: number;
  billsToPayAmount: number;
  receivableOutstanding: number;
  totalReceivable: number;
  invoiceCounts: InvoiceStatusCounts;
  pendingApprovals: number;
  expenseSlices: DashboardSlice[];
  advanceSlices: DashboardSlice[];
  billsPayableSlices: DashboardSlice[];
  receivablesByClient: DashboardSlice[];
  availableReportCurrencies: string[];
  displayCurrency?: string | null;
  draftInvoices?: number;
  sentInvoices?: number;
  partiallyPaidInvoices?: number;
  paidInvoices?: number;
  overdueInvoices?: number;
}

export interface GetDashboardParams {
  myOnly?: boolean;
  reportCurrency?: string;
}

export async function getDashboard(params: GetDashboardParams = {}): Promise<DashboardData> {
  const { myOnly = false, reportCurrency } = params;
  const { data } = await apiClient.get<DashboardData>("/dashboard", {
    params: {
      myOnly,
      ...(reportCurrency ? { reportCurrency } : {}),
    },
  });
  return data ?? ({} as DashboardData);
}
