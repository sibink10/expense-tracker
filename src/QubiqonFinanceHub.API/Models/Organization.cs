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

    public virtual ICollection<EmailTemplate> EmailTemplates { get; set; } = new List<EmailTemplate>();

    public virtual ICollection<EmployeeOrganizationContext> EmployeeOrganizationContexts { get; set; } = new List<EmployeeOrganizationContext>();

    public virtual ICollection<Employee> Employees { get; set; } = new List<Employee>();

    public virtual ICollection<OrganizationSetting> OrganizationSettingOrganizationId1Navigations { get; set; } = new List<OrganizationSetting>();

    public virtual ICollection<OrganizationSetting> OrganizationSettingOrganizations { get; set; } = new List<OrganizationSetting>();

    public virtual ICollection<TaxConfiguration> TaxConfigurations { get; set; } = new List<TaxConfiguration>();
}
