using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class RequestDocument
{
    public Guid Id { get; set; }

    public Guid OrganizationId { get; set; }

    public Guid? ExpenseRequestId { get; set; }

    public Guid? VendorBillId { get; set; }

    public Guid UploadedByEmployeeId { get; set; }

    public string FileName { get; set; } = null!;

    public string? ContentType { get; set; }

    public long FileSizeBytes { get; set; }

    public string FileUrl { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public virtual ExpenseRequest? ExpenseRequest { get; set; }

    public virtual Employee UploadedByEmployee { get; set; } = null!;

    public virtual VendorBill? VendorBill { get; set; }
}
