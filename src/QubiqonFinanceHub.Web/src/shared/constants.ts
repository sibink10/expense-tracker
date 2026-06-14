export const EXP_S = {
  PENDING: "Pending Approval",
  PENDING_BILL_APPROVAL: "Pending Bill Approval",
  APPROVED: "Approved",
  AWAITING_PAYMENT: "Awaiting Payment",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
  AWAITING_BILL: "Awaiting Bill",
  COMPLETED: "Completed",
  PARTIALLY_PAID: "Partially Paid",
} as const;

export const EXP_STATUS = {
  PENDING_APPROVAL: "PendingApproval",
  PENDING_BILL_APPROVAL: "PendingBillApproval",
  APPROVED: "Approved",
  AWAITING_PAYMENT: "AwaitingPayment",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
  AWAITING_BILL: "AwaitingBill",
  COMPLETED: "Completed",
  PARTIALLY_PAID: "PartiallyPaid",
} as const;

/** Shown when Pay is disabled until supporting bill documents exist */
export const EXPENSE_PAY_DISABLED_NO_BILL_TOOLTIP =
  "Upload at least one bill document before recording payment.";

export const BILL_S = {
  SUBMITTED: "Submitted",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  PAID: "Paid",
  PARTIALLY_PAID: "Partially Paid",
  OVERDUE: "Overdue",
} as const;

export const ADV_S = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  DISBURSED: "Disbursed",
  SETTLED: "Settled",
  PARTIALLY_DISBURSED: "Partially Disbursed",
  CANCELLED: "Cancelled",
} as const;

export const INV_S = {
  DRAFT: "Draft",
  SENT: "Sent",
  VIEWED: "Viewed",
  PAID: "Paid",
  PARTIALLY_PAID: "Partial",
  OVERDUE: "Overdue",
  PENDING_SIGNATURE: "PendingSignature",
  SIGNED: "Signed",
  SIGNATURE_FAILED: "SignatureFailed",
} as const;

/** Vendor bill: when finance should pay (stored as immediate | later). */
export const BILL_PAYMENT_PRIORITY = {
  IMMEDIATE: "immediate",
  LATER: "later",
} as const;

export const BILL_PAYMENT_PRIORITY_OPTIONS = [
  { v: BILL_PAYMENT_PRIORITY.IMMEDIATE, l: "Pay immediately" },
  { v: BILL_PAYMENT_PRIORITY.LATER, l: "Pay later" },
] as const;

export const PAY_TERMS = [
  { v: "immediate", l: "Immediate", d: 1 },
  { v: "net7", l: "Net 7", d: 7 },
  { v: "net15", l: "Net 15", d: 15 },
  { v: "net30", l: "Net 30", d: 30 },
  { v: "net45", l: "Net 45", d: 45 },
  { v: "net60", l: "Net 60", d: 60 },
];

export const CURRENCIES = [
  { v: "INR", l: "₹ INR", s: "₹" },
  { v: "USD", l: "$ USD", s: "$" },
  { v: "EUR", l: "€ EUR", s: "€" },
  { v: "GBP", l: "£ GBP", s: "£" },
  { v: "CAD", l: "$ CAD", s: "CA$" },
  { v: "AUD", l: "$ AUD", s: "A$" },
];

/** Expense account options for vendor bill line items */
export const BILL_ACCOUNTS = [
  { v: "it_internet", l: "IT and Internet Expenses" },
  { v: "office_supplies", l: "Office Supplies" },
  { v: "travel", l: "Travel and Conveyance" },
  { v: "professional_services", l: "Professional Services" },
  { v: "marketing", l: "Marketing and Advertising" },
  { v: "utilities", l: "Utilities" },
  { v: "rent", l: "Rent" },
  { v: "maintenance", l: "Maintenance and Repairs" },
  { v: "other", l: "Other Expenses" },
];

export const ROLES = {
  EMPLOYEE: "employee",
  APPROVER: "approver",
  FINANCE: "finance",
  ADMIN: "admin",
} as const;

export const MODAL_T = {
  VENDOR_EDIT: "vendor-edit",
  VENDOR_DETAIL: "vendor-detail",
  INV_PAY: "inv-pay",
  INV_DETAIL: "inv-detail",
  EXP_APPROVE: "exp-approve",
  REJECT: "reject",
  PAY: "pay",
  EXP_CANCEL_CONFIRM: "exp-cancel-confirm",
  EXP_DETAIL: "exp-detail",
  CLIENT_EDIT: "client-edit",
  CLIENT_DETAIL: "client-detail",
  BILL_APPROVE: "bill-approve",
  BILL_DETAIL: "bill-detail",
  BILL_EDIT: "bill-edit",
  TAX_CONFIG_DETAIL: "tax-config-detail",
  TAX_CONFIG_EDIT: "tax-config-edit",
  TAX_CONFIG_ADD: "tax-config-add",
  ADV_APPROVE: "adv-approve",
  ADV_DISBURSE: "adv-disburse",
  ADV_CANCEL_CONFIRM: "adv-cancel-confirm",
  ADV_REQUEST: "adv-request",
  ADV_EDIT: "adv-edit",
  ADV_DETAIL: "adv-detail",
  FORECAST_CANCEL_CONFIRM: "forecast-cancel-confirm",
} as const;

export const ITEM_T = {
  EXPENSE: "expense",
  BILL: "bill",
  ADVANCE: "advance",
} as const;

export const EVENTS = {
  VENDORS_REFRESH: "vendors-refresh",
  EXPENSES_REFRESH: "expenses-refresh",
  ADVANCES_REFRESH: "advances-refresh",
  BILLS_REFRESH: "bills-refresh",
  INVOICES_REFRESH: "invoices-refresh",
  CLIENTS_REFRESH: "clients-refresh",
  TAX_CONFIG_REFRESH: "tax-config-refresh",
  CATEGORIES_REFRESH: "categories-refresh",
  PAYMENT_TERMS_REFRESH: "payment-terms-refresh",
  FORECASTS_REFRESH: "forecasts-refresh",
  ACCOUNTS_REFRESH: "accounts-refresh",
  EMPLOYEES_REFRESH: "employees-refresh",
} as const;
