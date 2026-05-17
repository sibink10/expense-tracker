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

    public virtual ICollection<ActivityComment> ActivityComments { get; set; } = new List<ActivityComment>();

    public virtual ICollection<AdvancePayment> AdvancePayments { get; set; } = new List<AdvancePayment>();

    public virtual ICollection<Client1> Client1s { get; set; } = new List<Client1>();

    public virtual EmployeeOrganizationContext? EmployeeOrganizationContext { get; set; }

    public virtual EmployeeRole? EmployeeRole { get; set; }

    public virtual ICollection<Engagement> Engagements { get; set; } = new List<Engagement>();

    public virtual ICollection<ExpenseRequest> ExpenseRequests { get; set; } = new List<ExpenseRequest>();

    public virtual ICollection<Invoice1> Invoice1s { get; set; } = new List<Invoice1>();

    public virtual Organization Organization { get; set; } = null!;

    public virtual ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();

    public virtual ICollection<RequestDocument> RequestDocuments { get; set; } = new List<RequestDocument>();

    public virtual ICollection<Resource> ResourceCreatedBies { get; set; } = new List<Resource>();

    public virtual Resource? ResourceEmployee { get; set; }

    public virtual ICollection<RevenuePoint> RevenuePoints { get; set; } = new List<RevenuePoint>();

    public virtual ICollection<Timesheet> Timesheets { get; set; } = new List<Timesheet>();
}
