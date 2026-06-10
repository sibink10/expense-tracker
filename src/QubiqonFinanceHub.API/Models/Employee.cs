using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class Employee
{
    public Guid Id { get; set; }

    public Guid OrganizationId { get; set; }

    public string? EntraObjectId { get; set; }

    public string FullName { get; set; } = null!;

    public string Email { get; set; } = null!;

    public string? Department { get; set; }

    public string? Designation { get; set; }

    public string? EmployeeCode { get; set; }

    public string Role { get; set; } = null!;

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public bool IsDelete { get; set; }

    public Guid? ManagerId { get; set; }

    public string? FirstName { get; set; }

    public string? PersonalEmail { get; set; }

    public string? PersonalMobile { get; set; }

    public DateOnly? DateOfBirth { get; set; }

    public string? BloodGroup { get; set; }

    public string? Gender { get; set; }

    public DateOnly? DateOfJoining { get; set; }

    public string? EmploymentStatus { get; set; }

    public string? EmploymentType { get; set; }

    public int? BusinessUnitId { get; set; }

    public int? GradeId { get; set; }

    public virtual ICollection<ActivityComment> ActivityComments { get; set; } = new List<ActivityComment>();

    public virtual ICollection<AdvancePayment> AdvancePayments { get; set; } = new List<AdvancePayment>();

    public virtual ICollection<Announcement> Announcements { get; set; } = new List<Announcement>();

    public virtual ICollection<AssetHistory> AssetHistoryActionByNavigations { get; set; } = new List<AssetHistory>();

    public virtual ICollection<AssetHistory> AssetHistoryEmployees { get; set; } = new List<AssetHistory>();

    public virtual ICollection<Asset> Assets { get; set; } = new List<Asset>();

    public virtual ICollection<Attachment> Attachments { get; set; } = new List<Attachment>();

    public virtual ICollection<AttendanceEntry> AttendanceEntryApprovers { get; set; } = new List<AttendanceEntry>();

    public virtual ICollection<AttendanceEntry> AttendanceEntryEmployees { get; set; } = new List<AttendanceEntry>();

    public virtual ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();

    public virtual BusinessUnit? BusinessUnit { get; set; }

    public virtual ICollection<Client1> Client1s { get; set; } = new List<Client1>();

    public virtual ICollection<CompOffRequest> CompOffRequestApprovers { get; set; } = new List<CompOffRequest>();

    public virtual ICollection<CompOffRequest> CompOffRequestEmployees { get; set; } = new List<CompOffRequest>();

    public virtual ICollection<Department> Departments { get; set; } = new List<Department>();

    public virtual ICollection<EmployeeBankDetail> EmployeeBankDetails { get; set; } = new List<EmployeeBankDetail>();

    public virtual ICollection<EmployeeDocument> EmployeeDocumentEmployees { get; set; } = new List<EmployeeDocument>();

    public virtual ICollection<EmployeeDocument> EmployeeDocumentUploadedByEmployees { get; set; } = new List<EmployeeDocument>();

    public virtual EmployeeOrganizationContext? EmployeeOrganizationContext { get; set; }

    public virtual EmployeeProfileExtension? EmployeeProfileExtension { get; set; }

    public virtual EmployeeRole? EmployeeRole { get; set; }

    public virtual EmployeeRole1? EmployeeRole1 { get; set; }

    public virtual ICollection<EmployeeSalaryPackage> EmployeeSalaryPackageCreatedBies { get; set; } = new List<EmployeeSalaryPackage>();

    public virtual ICollection<EmployeeSalaryPackage> EmployeeSalaryPackageEmployees { get; set; } = new List<EmployeeSalaryPackage>();

    public virtual ICollection<Engagement> Engagements { get; set; } = new List<Engagement>();

    public virtual ICollection<ExpenseRequest> ExpenseRequests { get; set; } = new List<ExpenseRequest>();

    public virtual ICollection<Forecast> Forecasts { get; set; } = new List<Forecast>();

    public virtual ICollection<GeneratedLetter> GeneratedLetterEmployees { get; set; } = new List<GeneratedLetter>();

    public virtual ICollection<GeneratedLetter> GeneratedLetterGeneratedBies { get; set; } = new List<GeneratedLetter>();

    public virtual Grade? Grade { get; set; }

    public virtual ICollection<HelpdeskComment> HelpdeskComments { get; set; } = new List<HelpdeskComment>();

    public virtual ICollection<HelpdeskTicket> HelpdeskTicketAssignedTos { get; set; } = new List<HelpdeskTicket>();

    public virtual ICollection<HelpdeskTicket> HelpdeskTicketRaisedBies { get; set; } = new List<HelpdeskTicket>();

    public virtual ICollection<Employee> InverseManager { get; set; } = new List<Employee>();

    public virtual ICollection<Invoice1> Invoice1s { get; set; } = new List<Invoice1>();

    public virtual ICollection<LeaveApplication> LeaveApplicationApprovers { get; set; } = new List<LeaveApplication>();

    public virtual ICollection<LeaveApplication> LeaveApplicationEmployees { get; set; } = new List<LeaveApplication>();

    public virtual ICollection<LeaveBalance> LeaveBalances { get; set; } = new List<LeaveBalance>();

    public virtual ICollection<LeaveLedgerEntry> LeaveLedgerEntryEmployees { get; set; } = new List<LeaveLedgerEntry>();

    public virtual ICollection<LeaveLedgerEntry> LeaveLedgerEntryPerformedBies { get; set; } = new List<LeaveLedgerEntry>();

    public virtual ICollection<Location> Locations { get; set; } = new List<Location>();

    public virtual Employee? Manager { get; set; }

    public virtual ICollection<MaterialRequest> MaterialRequests { get; set; } = new List<MaterialRequest>();

    public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification>();

    public virtual Organization Organization { get; set; } = null!;

    public virtual ICollection<PayrollRun> PayrollRunClosedBies { get; set; } = new List<PayrollRun>();

    public virtual ICollection<PayrollRunDetail> PayrollRunDetails { get; set; } = new List<PayrollRunDetail>();

    public virtual ICollection<PayrollRun> PayrollRunInitiatedBies { get; set; } = new List<PayrollRun>();

    public virtual ICollection<PurchaseOrder> PurchaseOrders { get; set; } = new List<PurchaseOrder>();

    public virtual ICollection<QhrmsemployeeRole> QhrmsemployeeRoles { get; set; } = new List<QhrmsemployeeRole>();

    public virtual ICollection<QscmemployeeRole> QscmemployeeRoles { get; set; } = new List<QscmemployeeRole>();

    public virtual ICollection<Quotation> QuotationCreatedBies { get; set; } = new List<Quotation>();

    public virtual ICollection<Quotation> QuotationSelectedByNavigations { get; set; } = new List<Quotation>();

    public virtual ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();

    public virtual ICollection<RequestDocument1> RequestDocument1s { get; set; } = new List<RequestDocument1>();

    public virtual ICollection<RequestDocument> RequestDocuments { get; set; } = new List<RequestDocument>();

    public virtual ICollection<ResignationRequest> ResignationRequestApprovers { get; set; } = new List<ResignationRequest>();

    public virtual ICollection<ResignationRequest> ResignationRequestEmployees { get; set; } = new List<ResignationRequest>();

    public virtual ICollection<Resource> ResourceCreatedBies { get; set; } = new List<Resource>();

    public virtual Resource? ResourceEmployee { get; set; }

    public virtual ICollection<RevenuePoint> RevenuePoints { get; set; } = new List<RevenuePoint>();

    public virtual ICollection<ReviewAssignment> ReviewAssignments { get; set; } = new List<ReviewAssignment>();

    public virtual ICollection<ScmAuditLog> ScmAuditLogs { get; set; } = new List<ScmAuditLog>();

    public virtual ICollection<TimesheetMonthDocument> TimesheetMonthDocuments { get; set; } = new List<TimesheetMonthDocument>();

    public virtual ICollection<Timesheet> Timesheets { get; set; } = new List<Timesheet>();

    public virtual ICollection<Wfhrequest> WfhrequestApprovers { get; set; } = new List<Wfhrequest>();

    public virtual ICollection<Wfhrequest> WfhrequestEmployees { get; set; } = new List<Wfhrequest>();
}
