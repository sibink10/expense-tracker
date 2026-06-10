using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class Organization
{
    public Guid Id { get; set; }

    public string OrgName { get; set; } = null!;

    public string? PaymentAddress { get; set; }

    public string? LogoUrl { get; set; }

    public string? Address { get; set; }

    public string? City { get; set; }

    public string? State { get; set; }

    public string? Country { get; set; }

    public string? PostalCode { get; set; }

    public string? Phone { get; set; }

    public string? Industry { get; set; }

    public string? Fax { get; set; }

    public string? Website { get; set; }

    public string? SubName { get; set; }

    public bool IsActive { get; set; }

    public DateTime UpdatedAt { get; set; }

    public string? Tenant { get; set; }

    public bool UseSeparatePaymentAddress { get; set; }

    public string? BankName { get; set; }

    public string? IfscCode { get; set; }

    public string? AccountNumber { get; set; }

    public string? BankAddress { get; set; }

    public string? ZohoSignEmail { get; set; }

    public string? ZohoAuthorizationEndpoint { get; set; }

    public string? ZohoClientId { get; set; }

    public string? ZohoClientSecret { get; set; }

    public string? ZohoCode { get; set; }

    public string? ZohoDataCenter { get; set; }

    public string? ZohoHomePage { get; set; }

    public string? ZohoRedirectUri { get; set; }

    public string? ZohoRefreshToken { get; set; }

    public string? ZohoScope { get; set; }

    public string? ZohoSignApiBaseUrl { get; set; }

    public string? ZohoTokenEndpoint { get; set; }

    public string? AccountHolderName { get; set; }

    public string? SwiftCode { get; set; }

    public virtual ICollection<Announcement> Announcements { get; set; } = new List<Announcement>();

    public virtual ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();

    public virtual ICollection<BusinessUnit> BusinessUnits { get; set; } = new List<BusinessUnit>();

    public virtual ICollection<Department> Departments { get; set; } = new List<Department>();

    public virtual ICollection<Designation> Designations { get; set; } = new List<Designation>();

    public virtual ICollection<DocumentType> DocumentTypes { get; set; } = new List<DocumentType>();

    public virtual ICollection<EmailTemplate> EmailTemplates { get; set; } = new List<EmailTemplate>();

    public virtual ICollection<EmployeeDocument> EmployeeDocuments { get; set; } = new List<EmployeeDocument>();

    public virtual ICollection<EmployeeIdconfig> EmployeeIdconfigs { get; set; } = new List<EmployeeIdconfig>();

    public virtual ICollection<EmployeeOrganizationContext> EmployeeOrganizationContexts { get; set; } = new List<EmployeeOrganizationContext>();

    public virtual ICollection<Employee> Employees { get; set; } = new List<Employee>();

    public virtual ICollection<ExitReason> ExitReasons { get; set; } = new List<ExitReason>();

    public virtual ICollection<FocusArea> FocusAreas { get; set; } = new List<FocusArea>();

    public virtual ICollection<Grade> Grades { get; set; } = new List<Grade>();

    public virtual ICollection<HelpdeskCategory> HelpdeskCategories { get; set; } = new List<HelpdeskCategory>();

    public virtual ICollection<HelpdeskTicket> HelpdeskTickets { get; set; } = new List<HelpdeskTicket>();

    public virtual ICollection<HolidayPlan> HolidayPlans { get; set; } = new List<HolidayPlan>();

    public virtual ICollection<LeaveType> LeaveTypes { get; set; } = new List<LeaveType>();

    public virtual ICollection<LetterType> LetterTypes { get; set; } = new List<LetterType>();

    public virtual ICollection<Location> Locations { get; set; } = new List<Location>();

    public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification>();

    public virtual ICollection<OrganizationSetting> OrganizationSettingOrganizationId1Navigations { get; set; } = new List<OrganizationSetting>();

    public virtual ICollection<OrganizationSetting> OrganizationSettingOrganizations { get; set; } = new List<OrganizationSetting>();

    public virtual ICollection<PayrollComponent> PayrollComponents { get; set; } = new List<PayrollComponent>();

    public virtual ICollection<PayrollConfig> PayrollConfigs { get; set; } = new List<PayrollConfig>();

    public virtual ICollection<PayrollRun> PayrollRuns { get; set; } = new List<PayrollRun>();

    public virtual ICollection<PerformanceConfig> PerformanceConfigs { get; set; } = new List<PerformanceConfig>();

    public virtual ICollection<Pfoption> Pfoptions { get; set; } = new List<Pfoption>();

    public virtual ICollection<ReviewForm> ReviewForms { get; set; } = new List<ReviewForm>();

    public virtual ICollection<SalaryStructure> SalaryStructures { get; set; } = new List<SalaryStructure>();

    public virtual ICollection<Shift> Shifts { get; set; } = new List<Shift>();

    public virtual ICollection<TaxConfiguration> TaxConfigurations { get; set; } = new List<TaxConfiguration>();

    public virtual ICollection<TaxSlab> TaxSlabs { get; set; } = new List<TaxSlab>();

    public virtual ICollection<WorkMode> WorkModes { get; set; } = new List<WorkMode>();
}
