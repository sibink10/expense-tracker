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

// ═══════════════════════════════════════════════════
//  AUTH
// ═══════════════════════════════════════════════════
public record CurrentUserDto(Guid Id, string FullName, string Email, string? Department, string? Designation, UserRole Role, string Initials, Guid OrganizationId, string OrganizationName);

// ═══════════════════════════════════════════════════
//  ORGANIZATION
// ═══════════════════════════════════════════════════
public record OrganizationDto(Guid Id, string Name, string? LegalName, string Slug, string? LogoUrl, string PrimaryColor, string AccentColor, string? AddressLine1, string? AddressLine2, string? City, string? State, string Country, string? PinCode, string? GSTIN, string? PAN, string? CIN, string? TAN, string? ContactPersonName, string? ContactEmail, string? ContactPhone, string? Website, string? BankAccountName, string? BankAccountNumber, string? BankIFSC, string? BankName, string? BankBranch, string? BankSWIFT);

public record UpdateOrganizationRequest(string? Name, string? LegalName, string? LogoUrl, string? PrimaryColor, string? AccentColor, string? AddressLine1, string? AddressLine2, string? City, string? State, string? Country, string? PinCode, string? GSTIN, string? PAN, string? CIN, string? TAN, string? ContactPersonName, string? ContactEmail, string? ContactPhone, string? Website, string? BankAccountName, string? BankAccountNumber, string? BankIFSC, string? BankName, string? BankBranch, string? BankSWIFT);

// ═══════════════════════════════════════════════════
//  EXPENSE
// ═══════════════════════════════════════════════════
public record CreateExpenseRequest(decimal Amount, string Purpose, DateTime RequiredByDate, Guid? OnBehalfOfEmployeeId);
public record ExpenseDto(Guid Id, string ExpenseCode, Guid EmployeeId, string EmployeeName, string Department, decimal Amount, string Purpose, DateTime RequiredByDate, string Status, string? AttachmentUrl, string? PaymentReference, DateTime CreatedAt, List<CommentDto> Comments);

// ═══════════════════════════════════════════════════
//  ADVANCE
// ═══════════════════════════════════════════════════
public record CreateAdvanceRequest(decimal Amount, string Purpose);
public record AdvanceDto(Guid Id, string AdvanceCode, Guid EmployeeId, string EmployeeName, string Department, decimal Amount, string Purpose, string Status, string? PaymentReference, DateTime CreatedAt, List<CommentDto> Comments);

// ═══════════════════════════════════════════════════
//  VENDOR
// ═══════════════════════════════════════════════════
public record CreateVendorRequest(string Name, string? GSTIN, string Email, string? Phone, string? Category, string? Address);
public record UpdateVendorRequest(string? Name, string? GSTIN, string? Email, string? Phone, string? Category, string? Address);
public record VendorDto(Guid Id, string Name, string? GSTIN, string Email, string? Phone, string? Category, string? Address, bool IsActive);

// ═══════════════════════════════════════════════════
//  VENDOR BILL
// ═══════════════════════════════════════════════════
public record CreateBillRequest(Guid VendorId, decimal Amount, Guid? TaxConfigId, string Description, DateTime BillDate, DateTime DueDate, string PaymentTerms, string? CCEmails);
public record BillDto(Guid Id, string BillCode, Guid VendorId, string VendorName, string? VendorGSTIN, string VendorEmail, decimal Amount, string? TaxName, decimal TDSAmount, decimal TotalPayable, string Description, DateTime BillDate, DateTime DueDate, string PaymentTerms, string Status, string? AttachmentUrl, string? PaymentReference, DateTime? PaidAt, string SubmittedByName, DateTime CreatedAt, List<CommentDto> Comments);

// ═══════════════════════════════════════════════════
//  CLIENT
// ═══════════════════════════════════════════════════
public record CreateClientRequest(string Name, string? ContactPerson, string Email, string? Phone, string Country, string Currency, string TaxType, string? GSTIN, string? Address);
public record UpdateClientRequest(string? Name, string? ContactPerson, string? Email, string? Phone, string? Country, string? Currency, string? TaxType, string? GSTIN, string? Address);
public record ClientDto(Guid Id, string Name, string? ContactPerson, string Email, string? Phone, string Country, string Currency, string TaxType, string? GSTIN, string? Address, bool IsActive);

// ═══════════════════════════════════════════════════
//  INVOICE
// ═══════════════════════════════════════════════════
public record CreateInvoiceLineItemRequest(string Description, string? HSNCode, decimal Quantity, decimal Rate, Guid? GSTConfigId);
public record CreateInvoiceRequest(Guid ClientId, string Currency, List<CreateInvoiceLineItemRequest> LineItems, Guid? TaxConfigId, DateTime InvoiceDate, DateTime DueDate, string PaymentTerms, string? PurchaseOrder, string? Notes, bool SendImmediately);

public record InvoiceLineItemDto(int LineNumber, string Description, string? HSNCode, decimal Quantity, decimal Rate, decimal Amount, string? GSTName, decimal GSTRate, decimal GSTAmount, decimal TotalAmount);
public record InvoiceDto(Guid Id, string InvoiceCode, Guid ClientId, string ClientName, string ClientEmail, string? ClientContact, string ClientCountry, string Currency, decimal SubTotal, decimal TotalGST, string? TaxName, decimal TaxAmount, decimal Total, DateTime InvoiceDate, DateTime DueDate, string PaymentTerms, string? PurchaseOrder, string Status, string? Notes, string? TotalInWords, string? PaymentReference, DateTime? PaidAt, DateTime CreatedAt, List<InvoiceLineItemDto> LineItems, List<CommentDto> Comments);

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
public record ProcessPaymentRequest(string PaymentReference, PaymentMethod? Method, string? Notes);

// ═══════════════════════════════════════════════════
//  DASHBOARD
// ═══════════════════════════════════════════════════
public record DashboardDto(int PendingExpenses, int ApprovedExpenses, int CompletedExpenses, int PendingBills, int BillsToPayCount, decimal BillsToPayAmount, int PendingAdvances, int DraftInvoices, int SentInvoices, int PaidInvoices, int OverdueInvoices, decimal TotalReceivable);

// ═══════════════════════════════════════════════════
//  EMPLOYEE
// ═══════════════════════════════════════════════════
public record EmployeeDto(Guid Id, string FullName, string Email, string? Department, string? Designation, string? EmployeeCode, string Role, bool IsActive);
public record CreateEmployeeRequest(string EntraObjectId, string FullName, string Email, string? Department, string? Designation, string? EmployeeCode, string Role);
public record UpdateEmployeeRequest(string? FullName, string? Department, string? Designation, string? EmployeeCode, string? Role);
