namespace QubiqonFinanceHub.API.Models.Enums;

public enum UserRole { Employee = 0, Approver = 1, Finance = 2, Admin = 3, PROJECT_MANAGER = 4, QHRMS_EMPLOYEE = 5 }

public enum ExpenseStatus { PendingApproval = 0, Approved = 1, Rejected = 2, Cancelled = 3, AwaitingBill = 4, Completed = 5, PendingBillApproval = 6, AwaitingPayment = 7, PartiallyPaid = 8 }

public enum ForecastStatus { Draft = 0, Submitted = 1, Approved = 2, Rejected = 3, Cancelled = 4 }

public enum BillStatus { Draft = 0, Submitted = 1, Approved = 2, Rejected = 3, Paid = 4, Overdue = 5, PartiallyPaid = 6 }

/// <summary>When finance should pay this vendor bill (submitter preference).</summary>
public enum PaymentPriority { Immediate = 0, Later = 1 }

public enum AdvanceStatus { Pending = 0, Approved = 1, Rejected = 2, Disbursed = 3, Settled = 4, PartiallyDisbursed = 5, Cancelled = 6 }

public enum InvoiceStatus
{
    Draft = 0,
    Sent = 1,
    Viewed = 2,
    Paid = 3,
    PartiallyPaid = 4,
    Overdue = 5,
    PendingSignature = 6,
    Signed = 7,
    SignatureFailed = 8,
    Cancelled = 9
}

public enum PaymentMethod { NEFT = 0, RTGS = 1, IMPS = 2, UPI = 3, Cheque = 4, BankTransfer = 5, Wire = 6 }

public enum TaxType { TDS = 0, GST = 1, ClientTax = 2 }

public enum ClientTaxType { Domestic = 0, SEZ = 1, Export = 2 }

public enum CommentActionType { Submitted = 0, Approved = 1, Rejected = 2, Cancelled = 3, PaymentProcessed = 4, Sent = 5, General = 6, BillUploaded = 7, Created = 8 }

public enum SubscriptionPlan { Free = 0, Starter = 1, Professional = 2, Enterprise = 3 }

public enum CustomerType { Individual, Business }

/// <summary>Dashboard chart aggregation window.</summary>
public enum DashboardPeriod { Total = 0, Month = 1 }
