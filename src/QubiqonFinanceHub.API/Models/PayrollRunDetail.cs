using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class PayrollRunDetail
{
    public int Id { get; set; }

    public int PayrollRunId { get; set; }

    public Guid EmployeeId { get; set; }

    public int? WorkingDays { get; set; }

    public decimal Lopdays { get; set; }

    public decimal? GrossSalary { get; set; }

    public decimal? TotalDeductions { get; set; }

    public decimal? NetSalary { get; set; }

    public decimal? Pfemployee { get; set; }

    public decimal? Pfemployer { get; set; }

    public decimal? Ptamount { get; set; }

    public decimal? Tdsamount { get; set; }

    public string? ComponentBreakdown { get; set; }

    public string Status { get; set; } = null!;

    public virtual Employee Employee { get; set; } = null!;

    public virtual PayrollRun PayrollRun { get; set; } = null!;
}
