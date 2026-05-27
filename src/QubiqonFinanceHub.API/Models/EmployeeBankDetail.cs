using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class EmployeeBankDetail
{
    public int Id { get; set; }

    public Guid EmployeeId { get; set; }

    public string? BankName { get; set; }

    public string? BranchName { get; set; }

    public string? AccountHolderName { get; set; }

    public string? AccountNumber { get; set; }

    public string AccountType { get; set; } = null!;

    public string? Ifsccode { get; set; }

    public bool IsActive { get; set; }

    public virtual Employee Employee { get; set; } = null!;
}
