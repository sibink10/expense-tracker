using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using QubiqonFinanceHub.API.Models.Enums;

namespace QubiqonFinanceHub.API.Models.Entities;

// ═══════════════════════════════════════════════════
//  ORGANIZATION (Tenant Root)
// ═══════════════════════════════════════════════════
public class Organization
{
    [Key] public Guid Id { get; set; }
    [Required, MaxLength(200)] public string Name { get; set; } = "";
    [MaxLength(300)] public string? LegalName { get; set; }
    [Required, MaxLength(50)] public string Slug { get; set; } = "";
    [MaxLength(2048)] public string? LogoUrl { get; set; }
    [MaxLength(7)] public string PrimaryColor { get; set; } = "#1B2A4A";
    [MaxLength(7)] public string AccentColor { get; set; } = "#E8593C";

    // Address
    [MaxLength(300)] public string? AddressLine1 { get; set; }
    [MaxLength(300)] public string? AddressLine2 { get; set; }
    [MaxLength(100)] public string? City { get; set; }
    [MaxLength(100)] public string? State { get; set; }
    [MaxLength(100)] public string Country { get; set; } = "India";
    [MaxLength(20)] public string? PinCode { get; set; }

    // Tax Registration
    [MaxLength(20)] public string? GSTIN { get; set; }
    [MaxLength(15)] public string? PAN { get; set; }
    [MaxLength(25)] public string? CIN { get; set; }
    [MaxLength(15)] public string? TAN { get; set; }

    // Contact
    [MaxLength(100)] public string? ContactPersonName { get; set; }
    [MaxLength(256)] public string? ContactEmail { get; set; }
    [MaxLength(20)] public string? ContactPhone { get; set; }
    [MaxLength(256)] public string? Website { get; set; }

    // Bank Details
    [MaxLength(200)] public string? BankAccountName { get; set; }
    [MaxLength(30)] public string? BankAccountNumber { get; set; }
    [MaxLength(15)] public string? BankIFSC { get; set; }
    [MaxLength(100)] public string? BankName { get; set; }
    [MaxLength(200)] public string? BankBranch { get; set; }
    [MaxLength(15)] public string? BankSWIFT { get; set; }

    // Subscription
    public SubscriptionPlan Plan { get; set; } = SubscriptionPlan.Professional;
    public int MaxUsers { get; set; } = 25;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation
    public ICollection<Employee> Employees { get; set; } = new List<Employee>();
    public ICollection<OrganizationSetting> Settings { get; set; } = new List<OrganizationSetting>();
    public ICollection<TaxConfiguration> TaxConfigurations { get; set; } = new List<TaxConfiguration>();
    public ICollection<EmailTemplate> EmailTemplates { get; set; } = new List<EmailTemplate>();
}

// ═══════════════════════════════════════════════════
//  ORGANIZATION SETTINGS (key-value config)
// ═══════════════════════════════════════════════════
public class OrganizationSetting
{
    [Key] public Guid Id { get; set; }
    public Guid OrganizationId { get; set; }
    [ForeignKey(nameof(OrganizationId))] public Organization Organization { get; set; } = null!;
    [Required, MaxLength(100)] public string Key { get; set; } = "";
    [Required] public string Value { get; set; } = "";
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

// ═══════════════════════════════════════════════════
//  EMPLOYEE
// ═══════════════════════════════════════════════════
public class Employee
{
    [Key] public Guid Id { get; set; }
    public Guid OrganizationId { get; set; }
    [ForeignKey(nameof(OrganizationId))] public Organization Organization { get; set; } = null!;
    [Required, MaxLength(36)] public string EntraObjectId { get; set; } = "";
    [Required, MaxLength(100)] public string FullName { get; set; } = "";
    [Required, MaxLength(256)] public string Email { get; set; } = "";
    [MaxLength(100)] public string? Department { get; set; }
    [MaxLength(100)] public string? Designation { get; set; }
    [MaxLength(50)] public string? EmployeeCode { get; set; }
    public UserRole Role { get; set; } = UserRole.Employee;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}

// ═══════════════════════════════════════════════════
//  EXPENSE REQUEST
// ═══════════════════════════════════════════════════
public class ExpenseRequest
{
    [Key] public Guid Id { get; set; }
    public Guid OrganizationId { get; set; }
    [Required, MaxLength(30)] public string ExpenseCode { get; set; } = "";
    public Guid EmployeeId { get; set; }
    [ForeignKey(nameof(EmployeeId))] public Employee Employee { get; set; } = null!;
    public Guid? SubmittedByEmployeeId { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal Amount { get; set; }
    [Required, MaxLength(500)] public string Purpose { get; set; } = "";
    public DateOnly BillDate { get; set; }
    [Required, MaxLength(100)] public string BillNumber { get; set; } = "";
    public ExpenseStatus Status { get; set; } = ExpenseStatus.PendingApproval;

    [MaxLength(2048)] public string? BillImageUrl { get; set; }

    [MaxLength(100)] public string? PaymentReference { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public ICollection<ActivityComment> Comments { get; set; } = new List<ActivityComment>();
}

// ═══════════════════════════════════════════════════
//  ADVANCE PAYMENT
// ═══════════════════════════════════════════════════
public class AdvancePayment
{
    [Key] public Guid Id { get; set; }
    public Guid OrganizationId { get; set; }
    [Required, MaxLength(30)] public string AdvanceCode { get; set; } = "";
    public Guid EmployeeId { get; set; }
    [ForeignKey(nameof(EmployeeId))] public Employee Employee { get; set; } = null!;
    [Column(TypeName = "decimal(18,2)")] public decimal Amount { get; set; }
    [Required, MaxLength(500)] public string Purpose { get; set; } = "";
    public AdvanceStatus Status { get; set; } = AdvanceStatus.Pending;
    [MaxLength(100)] public string? PaymentReference { get; set; }
    public DateTime? DisbursedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<ActivityComment> Comments { get; set; } = new List<ActivityComment>();
}

// ═══════════════════════════════════════════════════
//  VENDOR
// ═══════════════════════════════════════════════════
public class Vendor
{
    [Key] public Guid Id { get; set; }
    public Guid OrganizationId { get; set; }
    [Required, MaxLength(200)] public string Name { get; set; } = "";
    [Required, MaxLength(256)] public string Email { get; set; } = "";
    [Required, MaxLength(500)] public string Address { get; set; } = "";
    [MaxLength(20)] public string? Phone { get; set; }
    [MaxLength(100)] public string? Category { get; set; }
    [MaxLength(20)] public string? GSTIN { get; set; }
    [MaxLength(100)] public string? ContactPerson { get; set; }
    [MaxLength(100)] public string? BankName { get; set; }
    [MaxLength(50)] public string? AccountNumber { get; set; }
    [MaxLength(20)] public string? IfscCode { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}

// ═══════════════════════════════════════════════════
//  VENDOR BILL
// ═══════════════════════════════════════════════════
public class VendorBill
{
    [Key] public Guid Id { get; set; }
    public Guid OrganizationId { get; set; }
    [Required, MaxLength(30)] public string BillCode { get; set; } = "";
    public Guid VendorId { get; set; }
    [ForeignKey(nameof(VendorId))] public Vendor Vendor { get; set; } = null!;
    [Column(TypeName = "decimal(18,2)")] public decimal Amount { get; set; }
    public Guid? TaxConfigId { get; set; } // TDS
    [ForeignKey(nameof(TaxConfigId))] public TaxConfiguration? TaxConfig { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal TDSAmount { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal TotalPayable { get; set; }
    [Required, MaxLength(1000)] public string Description { get; set; } = "";
    public DateTime BillDate { get; set; }
    public DateTime DueDate { get; set; }
    [MaxLength(20)] public string PaymentTerms { get; set; } = "net30";
    public BillStatus Status { get; set; } = BillStatus.Submitted;
    [MaxLength(2048)] public string? AttachmentUrl { get; set; }
    [MaxLength(1000)] public string? CCEmails { get; set; }
    public Guid SubmittedByEmployeeId { get; set; }
    [MaxLength(100)] public string? PaymentReference { get; set; }
    public DateTime? PaidAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public ICollection<ActivityComment> Comments { get; set; } = new List<ActivityComment>();
}

// ═══════════════════════════════════════════════════
//  CLIENT
// ═══════════════════════════════════════════════════
public class Client
{
    [Key] public Guid Id { get; set; }
    public Guid OrganizationId { get; set; }
    [Required, MaxLength(200)] public string Name { get; set; } = "";
    [MaxLength(100)] public string? ContactPerson { get; set; }
    [Required, MaxLength(256)] public string Email { get; set; } = "";
    [MaxLength(20)] public string? Phone { get; set; }
    [MaxLength(100)] public string Country { get; set; } = "India";
    [MaxLength(3)] public string Currency { get; set; } = "INR";
    public ClientTaxType TaxType { get; set; } = ClientTaxType.Domestic;
    [MaxLength(20)] public string? GSTIN { get; set; }
    [MaxLength(500)] public string? Address { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public CustomerType CustomerType { get; set; } = CustomerType.Business;
    [MaxLength(500)] public string? BillingAddress { get; set; }
    [MaxLength(500)] public string? ShippingAddress { get; set; }

    public DateTime? UpdatedAt { get; set; }
}

// ═══════════════════════════════════════════════════
//  INVOICE
// ═══════════════════════════════════════════════════
public class Invoice
{
    [Key] public Guid Id { get; set; }
    public Guid OrganizationId { get; set; }
    [Required, MaxLength(30)] public string InvoiceCode { get; set; } = "";
    public Guid ClientId { get; set; }
    [ForeignKey(nameof(ClientId))] public Client Client { get; set; } = null!;
    [MaxLength(3)] public string Currency { get; set; } = "INR";
    [Column(TypeName = "decimal(18,2)")] public decimal SubTotal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal TotalGST { get; set; }
    public Guid? TaxConfigId { get; set; } // Overall TDS
    [ForeignKey(nameof(TaxConfigId))] public TaxConfiguration? TaxConfig { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal TaxAmount { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal Total { get; set; }
    public DateTime InvoiceDate { get; set; }
    public DateTime DueDate { get; set; }
    [MaxLength(20)] public string PaymentTerms { get; set; } = "net30";
    [MaxLength(50)] public string? PurchaseOrder { get; set; }
    public InvoiceStatus Status { get; set; } = InvoiceStatus.Draft;
    [MaxLength(1000)] public string? Notes { get; set; }
    [MaxLength(500)] public string? TotalInWords { get; set; }
    [MaxLength(100)] public string? PaymentReference { get; set; }
    public DateTime? PaidAt { get; set; }
    public DateTime? SentAt { get; set; }
    public Guid CreatedByEmployeeId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public ICollection<InvoiceLineItem> LineItems { get; set; } = new List<InvoiceLineItem>();
    public ICollection<ActivityComment> Comments { get; set; } = new List<ActivityComment>();
    [MaxLength(50)] public string? InvoiceNumber { get; set; }
}

// ═══════════════════════════════════════════════════
//  INVOICE LINE ITEM
// ═══════════════════════════════════════════════════
public class InvoiceLineItem
{
    [Key] public Guid Id { get; set; }
    public Guid InvoiceId { get; set; }
    [ForeignKey(nameof(InvoiceId))] public Invoice Invoice { get; set; } = null!;
    public int LineNumber { get; set; }
    [Required, MaxLength(1000)] public string Description { get; set; } = "";
    [MaxLength(20)] public string? HSNCode { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal Quantity { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal Rate { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal Amount { get; set; }
    public Guid? GSTConfigId { get; set; }
    [ForeignKey(nameof(GSTConfigId))] public TaxConfiguration? GSTConfig { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal GSTAmount { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal TotalAmount { get; set; }
}

// ═══════════════════════════════════════════════════
//  TAX CONFIGURATION (Admin-managed)
// ═══════════════════════════════════════════════════
public class TaxConfiguration
{
    [Key] public Guid Id { get; set; }
    public Guid OrganizationId { get; set; }
    [ForeignKey(nameof(OrganizationId))] public Organization Organization { get; set; } = null!;
    public TaxType Type { get; set; }
    [Required, MaxLength(200)] public string Name { get; set; } = "";
    [Column(TypeName = "decimal(5,2)")] public decimal Rate { get; set; }
    [MaxLength(20)] public string? Section { get; set; }
    [MaxLength(20)] public string? SubType { get; set; } // IGST, CGST+SGST, SEZ
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

// ═══════════════════════════════════════════════════
//  ACTIVITY COMMENT (Polymorphic audit trail)
// ═══════════════════════════════════════════════════
public class ActivityComment
{
    [Key] public Guid Id { get; set; }
    // Polymorphic: one of these will be set
    public Guid? ExpenseRequestId { get; set; }
    public Guid? VendorBillId { get; set; }
    public Guid? AdvancePaymentId { get; set; }
    public Guid? InvoiceId { get; set; }
    public Guid CommentByEmployeeId { get; set; }
    [ForeignKey(nameof(CommentByEmployeeId))] public Employee CommentByEmployee { get; set; } = null!;
    [Required, MaxLength(2000)] public string Text { get; set; } = "";
    public CommentActionType ActionType { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

// ═══════════════════════════════════════════════════
//  EMAIL TEMPLATE
// ═══════════════════════════════════════════════════
public class EmailTemplate
{
    [Key] public Guid Id { get; set; }
    public Guid OrganizationId { get; set; }
    [ForeignKey(nameof(OrganizationId))] public Organization Organization { get; set; } = null!;
    [Required, MaxLength(50)] public string TemplateKey { get; set; } = "";
    [Required, MaxLength(500)] public string Subject { get; set; } = "";
    [Required] public string HtmlBody { get; set; } = "";
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}

// ═══════════════════════════════════════════════════
//  CODE SEQUENCES
// ═══════════════════════════════════════════════════
public class CodeSequence
{
    [Key] public Guid Id { get; set; }
    public Guid OrganizationId { get; set; }
    [Required, MaxLength(30)] public string SequenceType { get; set; } = ""; // expense, bill, advance, invoice
    public int LastNumber { get; set; }
}
