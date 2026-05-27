using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class PayrollRun
{
    public int Id { get; set; }

    public Guid OrganizationId { get; set; }

    public int PayPeriodYear { get; set; }

    public int PayPeriodMonth { get; set; }

    public string Status { get; set; } = null!;

    public int? TotalEmployees { get; set; }

    public decimal? TotalGross { get; set; }

    public decimal? TotalDeductions { get; set; }

    public decimal? TotalNetPay { get; set; }

    public decimal? TotalPf { get; set; }

    public decimal? TotalPt { get; set; }

    public decimal? TotalTds { get; set; }

    public Guid? InitiatedById { get; set; }

    public DateTime InitiatedAt { get; set; }

    public Guid? ClosedById { get; set; }

    public DateTime? ClosedAt { get; set; }

    public virtual Employee? ClosedBy { get; set; }

    public virtual Employee? InitiatedBy { get; set; }

    public virtual Organization Organization { get; set; } = null!;

    public virtual ICollection<PayrollRunDetail> PayrollRunDetails { get; set; } = new List<PayrollRunDetail>();
}
