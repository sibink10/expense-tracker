namespace QubiqonFinanceHub.API.Models.Enums;

public enum UserRole { Employee = 0, Approver = 1, Finance = 2, Admin = 3 }

public enum ExpenseStatus { PendingApproval = 0, Approved = 1, Rejected = 2, Cancelled = 3, AwaitingBill = 4, Completed = 5 }

public enum BillStatus { Draft = 0, Submitted = 1, Approved = 2, Rejected = 3, Paid = 4, Overdue = 5 }

public enum AdvanceStatus { Pending = 0, Approved = 1, Rejected = 2, Disbursed = 3, Settled = 4 }

public enum InvoiceStatus { Draft = 0, Sent = 1, Viewed = 2, Paid = 3, PartiallyPaid = 4, Overdue = 5 }

public enum PaymentMethod { NEFT = 0, RTGS = 1, IMPS = 2, UPI = 3, Cheque = 4, BankTransfer = 5, Wire = 6 }

public enum TaxType { TDS = 0, GST = 1 }

public enum ClientTaxType { Domestic = 0, SEZ = 1, Export = 2 }

public enum CommentActionType { Submitted = 0, Approved = 1, Rejected = 2, Cancelled = 3, PaymentProcessed = 4, Sent = 5, General = 6 }

public enum SubscriptionPlan { Free = 0, Starter = 1, Professional = 2, Enterprise = 3 }
