using QubiqonFinanceHub.API.Models.Enums;

namespace QubiqonFinanceHub.API.DTOs;

// ═══════════════════════════════════════════════════
//  COMMON
// ═══════════════════════════════════════════════════
public record PaginatedResult<T>(List<T> Items, int TotalCount, int Page, int PageSize)
{
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
    public bool HasNext => Page < TotalPages;
}

public record FilterParams(int Page = 1, int PageSize = 20, string? Status = null, string? Search = null, string SortBy = "CreatedAt", bool Desc = true);

public record CommentDto(Guid Id, string By, string Text, string ActionType, DateTime CreatedAt);
public record DocumentDto(Guid Id, string FileName, string? ContentType, long FileSizeBytes, DateTime UploadedAt);

// ═══════════════════════════════════════════════════
//  AUTH
// ═══════════════════════════════════════════════════
public record CurrentUserDto(Guid Id, string FullName, string Email, string? Department, string? Designation, UserRole Role, string Initials, Guid OrganizationId, string OrganizationName);

// ═══════════════════════════════════════════════════
//  ORGANIZATION
// ═══════════════════════════════════════════════════
public record CreateOrganizationRequest(
    string OrgName,
    string? SubName,
    string? Address,
    string? PaymentAddress,
    bool? UseSeparatePaymentAddress,
    string? City,
    string? State,
    string? Country,
    string? PostalCode,
    string? Phone,
    string? Fax,
    string? Website,
    string? Industry,
    string? Tenant,
    bool? Selected,
    IFormFile? LogoFile
);

public record UpdateOrganizationRequest(
    string? OrgName,
    string? SubName,
    string? Address,
    string? PaymentAddress,
    bool? UseSeparatePaymentAddress,
    string? City,
    string? State,
    string? Country,
    string? PostalCode,
    string? Phone,
    string? Fax,
    string? Website,
    string? Industry,
    string? Tenant,
    bool? Selected,
    IFormFile? LogoFile
);

public record OrganizationDto(
    Guid Id,
    string OrgName,
    string? SubName,
    string? Tenant,
    bool Selected,
    string? LogoUrl,
    string? Address,
    string? PaymentAddress,
    bool UseSeparatePaymentAddress,
    string? City,
    string? State,
    string? Country,
    string? PostalCode,
    string? Phone,
    string? Fax,
    string? Website,
    string? Industry
);

// ═══════════════════════════════════════════════════
//  ORGANIZATION SETTINGS
// ═══════════════════════════════════════════════════
public class OrganizationSettingDto
{
    public string Key { get; set; } = "";
    public string Value { get; set; } = "";
    public DateTime UpdatedAt { get; set; }
}

public class SettingDto
{
    public Guid Id { get; set; }
    public string Value { get; set; }
}

public class BulkSettingItemDto
{
    public Guid? Id { get; set; }
    public string Key { get; set; } = "";
    public string Value { get; set; } = "";
}

// ═══════════════════════════════════════════════════
//  EXPENSE
// ═══════════════════════════════════════════════════
public class CreateExpenseRequest
{
    public decimal Amount { get; set; }
    public string Purpose { get; set; } = "";
    public DateOnly BillDate { get; set; }
    public Guid? OnBehalfOfEmployeeId { get; set; }
    public List<IFormFile> BillImages { get; set; } = new();
    public IFormFile? BillImage { get; set; }
}

public class UpdateExpenseRequest
{
    public decimal Amount { get; set; }
    public string Purpose { get; set; } = "";
    public DateOnly BillDate { get; set; }
    public List<IFormFile> BillImages { get; set; } = new();
    public IFormFile? BillImage { get; set; }  // null = keep existing
}

public class UploadBillRequest
{
    public List<IFormFile> BillImages { get; set; } = new();
    public IFormFile? BillImage { get; set; }
}

public record ExpenseDto(Guid Id, string ExpenseCode, Guid EmployeeId, string EmployeeName, string Department, decimal Amount, string Purpose, DateOnly BillDate, string Status, string? AttachmentUrl, string? PaymentReference, DateTime CreatedAt, List<CommentDto> Comments, List<DocumentDto> Documents);

// ═══════════════════════════════════════════════════
//  ADVANCE
// ═══════════════════════════════════════════════════
public record CreateAdvanceRequest(decimal Amount, string Purpose);
public record AdvanceDto(Guid Id, string AdvanceCode, Guid EmployeeId, string EmployeeName, string Department, decimal Amount, string Purpose, string Status, string? PaymentReference, DateTime CreatedAt, List<CommentDto> Comments);

// ═══════════════════════════════════════════════════
//  VENDOR
// ═══════════════════════════════════════════════════
public record CreateVendorRequest(
    string Name,
    string Email,
    string Address,
    string? Phone,
    string? Category,
    string? GSTIN,
    string? ContactPerson,
    string? BankName,
    string? AccountNumber,
    string? IfscCode
);
public record UpdateVendorRequest(
    string? Name,
    string? Email,
    string? Address,
    string? Phone,
    string? Category,
    string? GSTIN,
    string? ContactPerson,
    string? BankName,
    string? AccountNumber,
    string? IfscCode
);
public record VendorDto(
    Guid Id,
    string Name,
    string Email,
    string Address,
    string? Phone,
    string? Category,
    string? GSTIN,
    string? ContactPerson,
    string? BankName,
    string? AccountNumber,
    string? IfscCode,
    bool IsActive,
    DateTime CreatedAt
);

// ═══════════════════════════════════════════════════
//  VENDOR BILL
// ═══════════════════════════════════════════════════
public class CreateBillRequest
{
    public Guid VendorId { get; set; }
    public decimal Amount { get; set; }
    public string vendorBillNumber { get; set; }
    public Guid? TaxConfigId { get; set; }
    public string Description { get; set; } = "";
    public DateTime BillDate { get; set; }
    public DateTime DueDate { get; set; }
    public string PaymentTerms { get; set; } = "";
    public string? CCEmails { get; set; }
    public List<IFormFile> Attachments { get; set; } = new();
    public IFormFile? Attachment { get; set; }
}
public record BillDto(Guid Id, string BillCode, Guid VendorId, string VendorName,string? vendorBillNumber, string? VendorGSTIN, string VendorEmail, decimal Amount, string? TaxName, decimal TDSAmount, decimal TotalPayable, string Description, DateTime BillDate, DateTime DueDate, string PaymentTerms, string Status, string? AttachmentUrl, string? PaymentReference, DateTime? PaidAt, string SubmittedByName, DateTime CreatedAt, List<CommentDto> Comments, List<DocumentDto> Documents);

// ═══════════════════════════════════════════════════
//  CLIENT
// ═══════════════════════════════════════════════════
public record CreateClientRequest(
    string Name,
    string Email,
    string Country,
    string Currency,
    string TaxType,
    string CustomerType,
    string? ContactPerson,
    string? Phone,
    string? GSTIN,
    string? BillingAddress,
    string? ShippingAddress
);
public record UpdateClientRequest(
    string? Name,
    string? Email,
    string? Country,
    string? Currency,
    string? TaxType,
    string? CustomerType,
    string? ContactPerson,
    string? Phone,
    string? GSTIN,
    string? BillingAddress,
    string? ShippingAddress

);
public record ClientDto(
    Guid Id,
    string Name,
    string Email,
    string Country,
    string Currency,
    string TaxType,
    string CustomerType,
    string? ContactPerson,
    string? Phone,
    string? GSTIN,
    string? BillingAddress,
    string? ShippingAddress,
    bool IsActive,
    DateTime CreatedAt
);

// ═══════════════════════════════════════════════════
//  INVOICE
// ═══════════════════════════════════════════════════
public record CreateInvoiceLineItemRequest(string Description, string? HSNCode, decimal Quantity, decimal Rate, Guid? GSTConfigId);
public record CreateInvoiceRequest(Guid ClientId, string Currency, List<CreateInvoiceLineItemRequest> LineItems, Guid? TaxConfigId, DateTime InvoiceDate, DateTime DueDate, string PaymentTerms, string? PurchaseOrder, string? Notes, bool SendImmediately);

public record InvoiceLineItemDto(int LineNumber, string Description, string? HSNCode, decimal Quantity, decimal Rate, decimal Amount, string? GSTName, decimal GSTRate, decimal GSTAmount, decimal TotalAmount);
public record InvoiceDto(
    Guid Id,
    string InvoiceCode,
    Guid ClientId,
    string ClientName,
    string ClientEmail,
    string? ClientContact,
    string ClientCountry,
    string Currency,
    decimal SubTotal,
    decimal? TotalGST,
    string? TaxName,
    decimal TaxAmount,
    decimal Total,
    decimal paidAmound,
    DateTime InvoiceDate,
    DateTime DueDate,
    string PaymentTerms,
    string? PurchaseOrder,
    string Status,
    string? Notes,
    string? TotalInWords,
    string? PaymentReference,
    DateTime? PaidAt,
    DateTime CreatedAt,
    List<InvoiceLineItemDto> LineItems,
    List<CommentDto> Comments
);

public record InvoiceStatusCountsDto(
    int Draft,
    int Sent,
    int PartiallyPaid,
    int Paid,
    int Overdue
);

// ═══════════════════════════════════════════════════
//  TAX
// ═══════════════════════════════════════════════════
public record CreateTaxConfigRequest(string Type, string Name, decimal Rate, string? Section, string? SubType);
public record TaxConfigDto(Guid Id, string Type, string Name, decimal Rate, string? Section, string? SubType, bool IsActive);

// ═══════════════════════════════════════════════════
//  APPROVAL / PAYMENT ACTIONS
// ═══════════════════════════════════════════════════
public record ApproveRequest(string? Comments);
public record RejectRequest(string Comments);
public record ProcessPaymentRequest(string PaymentReference, PaymentMethod? Method, string? Notes,decimal paidAmound);

// ═══════════════════════════════════════════════════
//  DASHBOARD
// ═══════════════════════════════════════════════════
public record DashboardDto(int PendingExpenses, int ApprovedExpenses, int CompletedExpenses, int PendingBills, int BillsToPayCount, decimal BillsToPayAmount, int PendingAdvances, int DraftInvoices, int SentInvoices, int PaidInvoices, int OverdueInvoices, decimal TotalReceivable);

// ═══════════════════════════════════════════════════
//  EMPLOYEE
// ═══════════════════════════════════════════════════
public record EmployeeDto(Guid Id, string FullName, string Email, string? Department, string? Designation, string? EmployeeCode, string Role, bool IsActive);
public record CreateEmployeeRequest(string? EntraObjectId, string FullName, string Email, string? Department, string? Designation, string? EmployeeCode, string Role);
public record UpdateEmployeeRequest(string? FullName, string? Department, string? Designation, string? EmployeeCode, string? Role);


// ═══════════════════════════════════════════════════
//  CATOGORY
// ═══════════════════════════════════════════════════
public record CategoryDto(Guid Id, string Name, bool IsActive);
public record CreateCategoryRequest(string Name); 
public record UpdateCategoryRequest(string Name, bool IsActive);