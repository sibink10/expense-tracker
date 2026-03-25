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
