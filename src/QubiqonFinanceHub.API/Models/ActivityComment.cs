using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class ActivityComment
{
    public Guid Id { get; set; }

    public Guid? ExpenseRequestId { get; set; }

    public Guid? VendorBillId { get; set; }

    public Guid? AdvancePaymentId { get; set; }

    public Guid? InvoiceId { get; set; }

    public Guid CommentByEmployeeId { get; set; }

    public string Text { get; set; } = null!;

    public string ActionType { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public Guid? ForecastId { get; set; }

    public virtual AdvancePayment? AdvancePayment { get; set; }

    public virtual Employee CommentByEmployee { get; set; } = null!;

    public virtual ExpenseRequest? ExpenseRequest { get; set; }

    public virtual Forecast? Forecast { get; set; }

    public virtual Invoice? Invoice { get; set; }

    public virtual VendorBill? VendorBill { get; set; }
}
