export const EXP_S = {
  PENDING: "Pending Approval",
  PENDING_BILL_APPROVAL: "Pending Bill Approval",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
  AWAITING_BILL: "Awaiting Bill",
  COMPLETED: "Completed",
} as const;

export const BILL_S = {
  SUBMITTED: "Submitted",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  PAID: "Paid",
  OVERDUE: "Overdue",
} as const;

export const ADV_S = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  DISBURSED: "Disbursed",
} as const;

export const INV_S = {
  DRAFT: "Draft",
  SENT: "Sent",
  VIEWED: "Viewed",
  PAID: "Paid",
  PARTIALLY_PAID: "Partial",
  OVERDUE: "Overdue",
} as const;

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
