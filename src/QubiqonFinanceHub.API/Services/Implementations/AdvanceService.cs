using Microsoft.EntityFrameworkCore;
using QubiqonFinanceHub.API.Data;
using QubiqonFinanceHub.API.DTOs;
using QubiqonFinanceHub.API.Models.Constants;
using QubiqonFinanceHub.API.Models.Entities;
using QubiqonFinanceHub.API.Models.Enums;
using QubiqonFinanceHub.API.Services.Helpers;
using QubiqonFinanceHub.API.Services.Interfaces;

namespace QubiqonFinanceHub.API.Services.Implementations;

public class AdvanceService : IAdvanceService
{
    private readonly FinanceHubDbContext _db;
    private readonly ITenantService _tenant;
    private readonly ICodeGeneratorService _codeGen;
    private readonly IEmailService _email;
    private readonly ILogger<AdvanceService> _log;

    public AdvanceService(FinanceHubDbContext db, ITenantService tenant, ICodeGeneratorService codeGen, IEmailService email, ILogger<AdvanceService> log)
    { _db = db; _tenant = tenant; _codeGen = codeGen; _email = email; _log = log; }

    public async Task<AdvanceDto> CreateAsync(CreateAdvanceRequest dto)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var emp = await _tenant.GetCurrentEmployeeAsync();

        // 🔹 Get balanceCap
        var balanceSetting = await _db.OrganizationSettings
            .FirstOrDefaultAsync(s => s.OrganizationId == orgId && s.Key == "balanceCap");

        decimal balanceCap = balanceSetting != null ? decimal.Parse(balanceSetting.Value) : 0;

        // ❗ Validate request
        if (dto.Amount > balanceCap)
            throw new InvalidOperationException($"Requested amount exceeds available balance (₹{balanceCap:N2}).");

        var code = await _codeGen.GenerateBillNumberAsync(orgId, "advance");

        var advance = new AdvancePayment
        {
            Id = Guid.NewGuid(),
            OrganizationId = orgId,
            AdvanceCode = code,
            EmployeeId = emp.Id,
            Amount = dto.Amount,
            Purpose = dto.Purpose,
            Status = AdvanceStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        advance.Comments.Add(new ActivityComment
        {
            Id = Guid.NewGuid(),
            AdvancePaymentId = advance.Id,
            CommentByEmployeeId = emp.Id,
            Text = $"Advance requested for ₹{dto.Amount:N2}.",
            ActionType = CommentActionType.Submitted
        });

        _db.AdvancePayments.Add(advance);
        await _db.SaveChangesAsync();

        var reviewers = await _db.Employees
            .Where(e => e.OrganizationId == orgId &&
                        e.IsActive &&
                        !e.IsDelete &&
                        !string.IsNullOrWhiteSpace(e.Email) &&
                        e.Role == UserRole.Approver)
            .Select(e => e.Email)
            .Distinct()
            .ToListAsync();

        if (reviewers.Count > 0)
        {
            await _email.SendNotificationAsync(
                Constants.EmailTemplateKeys.AdvanceSubmitted,
                new Dictionary<string, string>
                {
                    ["link_type"] = "approve",
                    ["entity_type"] = "advance",
                    ["entity_api_id"] = advance.Id.ToString(),
                    ["employee_name"] = emp.FullName,
                    ["advance_id"] = advance.AdvanceCode,
                    ["purpose"] = advance.Purpose,
                    ["amount"] = $"₹{advance.Amount:N2}",
                    ["request_date"] = advance.CreatedAt.ToString("dd MMM yyyy"),
                    ["submitted_by"] = emp.FullName,
                    ["submission_notes"] = "",
                    ["action_date"] = DateTime.UtcNow.ToString("dd MMM yyyy hh:mm tt 'UTC'"),
                },
                string.Join(",", reviewers));
        }

        _log.LogInformation("Advance {Code} created by {Employee}", code, emp.FullName);

        return (await GetByIdAsync(advance.Id))!;
    }

    public async Task<AdvanceDto?> GetByIdAsync(Guid id)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var a = await _db.AdvancePayments
            .Include(x => x.Employee)
            .Include(x => x.Comments).ThenInclude(c => c.CommentByEmployee)
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId);

        return a == null ? null : MapToDto(a);
    }

    public async Task<PaginatedResult<AdvanceDto>> ListAsync(FilterParams f, bool myOnly = false)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var q = _db.AdvancePayments
            .Include(x => x.Employee)
            .Include(x => x.Comments).ThenInclude(c => c.CommentByEmployee)
            .Where(x => x.OrganizationId == orgId)
            .AsNoTracking();

        if (myOnly) { var empId = _tenant.GetCurrentEmployeeId(); q = q.Where(x => x.EmployeeId == empId); }
        if (f.Status != null && Enum.TryParse<AdvanceStatus>(f.Status, true, out var status))
            q = q.Where(x => x.Status == status);
        if (!string.IsNullOrWhiteSpace(f.Search))
        {
            var s = f.Search.ToLower();
            q = q.Where(x => x.AdvanceCode.ToLower().Contains(s) || x.Purpose.ToLower().Contains(s));
        }

        var total = await q.CountAsync();
        q = q.ApplyAdvanceSorting(f);
        var items = await q.Skip((f.Page - 1) * f.PageSize).Take(f.PageSize).ToListAsync();

        return new PaginatedResult<AdvanceDto>(items.Select(MapToDto).ToList(), total, f.Page, f.PageSize);
    }

    public async Task<AdvanceDto> ApproveAsync(Guid id, ApproveRequest dto)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var emp = await _tenant.GetCurrentEmployeeAsync();

        var advance = await _db.AdvancePayments
            .Include(x => x.Employee)
            .FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId)
            ?? throw new KeyNotFoundException("Advance not found");

        if (advance.EmployeeId == emp.Id)
            throw new InvalidOperationException("You cannot approve an advance request raised by yourself.");

        if (advance.Status != AdvanceStatus.Pending)
            throw new InvalidOperationException("Only pending advances can be approved.");

        // 🔹 Get settings
        var settings = await _db.OrganizationSettings
            .Where(s => s.OrganizationId == orgId &&
                   (s.Key == "balanceCap" || s.Key == "advCap"))
            .ToListAsync();

        var balanceSetting = settings.FirstOrDefault(s => s.Key == "balanceCap");
        var advCapSetting = settings.FirstOrDefault(s => s.Key == "advCap");

        decimal balanceCap;

        if (balanceSetting != null)
        {
            // ✅ Use existing balance
            balanceCap = decimal.Parse(balanceSetting.Value);
        }
        else
        {
            // 🔹 Fallback to advCap
            decimal advCap = advCapSetting != null ? decimal.Parse(advCapSetting.Value) : 0;

            // 🔹 Calculate used amount
            var used = await _db.AdvancePayments
                .Where(x => x.OrganizationId == orgId && x.Status == AdvanceStatus.Approved)
                .SumAsync(x => (decimal?)x.Amount) ?? 0;

            balanceCap = advCap - used;

            if (balanceCap < 0)
                balanceCap = 0;
        }

        // ❗ Validate balance
        if (advance.Amount > balanceCap)
            throw new InvalidOperationException("Insufficient balance cap.");

        // 🔹 Deduct balance
        balanceCap -= advance.Amount;

        // 🔹 Update/Create balanceCap
        if (balanceSetting != null)
        {
            balanceSetting.Value = balanceCap.ToString();
            balanceSetting.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            _db.OrganizationSettings.Add(new OrganizationSetting
            {
                Id = Guid.NewGuid(),
                OrganizationId = orgId,
                Key = "balanceCap",
                Value = balanceCap.ToString(),
                UpdatedAt = DateTime.UtcNow
            });
        }

        // 🔹 Approve advance
        advance.Status = AdvanceStatus.Approved;

        _db.ActivityComments.Add(new ActivityComment
        {
            Id = Guid.NewGuid(),
            AdvancePaymentId = id,
            CommentByEmployeeId = emp.Id,
            Text = dto.Comments ?? "Approved.",
            ActionType = CommentActionType.Approved
        });

        await _db.SaveChangesAsync();

        var financeEmails = await _db.Employees
            .Where(e => e.OrganizationId == orgId &&
                        e.IsActive &&
                        !e.IsDelete &&
                        !string.IsNullOrWhiteSpace(e.Email) &&
                        e.Role == UserRole.Finance)
            .Select(e => e.Email)
            .Distinct()
            .ToListAsync();

        if (financeEmails.Count > 0)
        {
            await _email.SendNotificationAsync(
                Constants.EmailTemplateKeys.AdvanceApproved,
                new Dictionary<string, string>
                {
                    ["link_type"] = "disburse",
                    ["entity_type"] = "advance",
                    ["entity_api_id"] = advance.Id.ToString(),
                    ["employee_name"] = advance.Employee.FullName,
                    ["advance_id"] = advance.AdvanceCode,
                    ["purpose"] = advance.Purpose,
                    ["amount"] = $"₹{advance.Amount:N2}",
                    ["request_date"] = advance.CreatedAt.ToString("dd MMM yyyy"),
                    ["approver_name"] = emp.FullName,
                    ["approver_comments"] = dto.Comments ?? "",
                    ["action_date"] = DateTime.UtcNow.ToString("dd MMM yyyy hh:mm tt 'UTC'"),
                },
                string.Join(",", financeEmails));
        }

        return (await GetByIdAsync(id))!;
    }

    public async Task<AdvanceDto> RejectAsync(Guid id, RejectRequest dto)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var emp = await _tenant.GetCurrentEmployeeAsync();
        var advance = await _db.AdvancePayments
            .Include(x => x.Employee)
            .FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId)
            ?? throw new KeyNotFoundException("Advance not found");

        if (advance.Status == AdvanceStatus.Rejected)
            throw new InvalidOperationException("Advance is already rejected.");

        if (advance.Status == AdvanceStatus.Cancelled)
            throw new InvalidOperationException("Cannot reject a cancelled advance.");

        if (advance.Status == AdvanceStatus.Disbursed || advance.Status == AdvanceStatus.Settled)
            throw new InvalidOperationException($"Cannot reject advance in '{advance.Status}' status.");

        // Restore pool: Approved → full advance was reserved on approve. PartiallyDisbursed → restore unpaid remainder only.
        if (advance.Status == AdvanceStatus.Approved)
            await AddDeltaToBalanceCapAsync(orgId, advance.Amount);
        else if (advance.Status == AdvanceStatus.PartiallyDisbursed)
        {
            var remainingBalance = advance.Amount - advance.PaidAmount;
            await AddDeltaToBalanceCapAsync(orgId, remainingBalance);
        }

        advance.Status = AdvanceStatus.Rejected;

        _db.ActivityComments.Add(new ActivityComment
        {
            Id = Guid.NewGuid(),
            AdvancePaymentId = id,
            CommentByEmployeeId = emp.Id,
            Text = dto.Comments,
            ActionType = CommentActionType.Rejected
        });

        await _db.SaveChangesAsync();

        await _email.SendNotificationAsync(
            Constants.EmailTemplateKeys.AdvanceRejected,
            new Dictionary<string, string>
            {
                ["link_type"] = "detail",
                ["entity_type"] = "advance",
                ["entity_api_id"] = advance.Id.ToString(),
                ["employee_name"] = advance.Employee.FullName,
                ["advance_id"] = advance.AdvanceCode,
                ["purpose"] = advance.Purpose,
                ["amount"] = $"₹{advance.Amount:N2}",
                ["request_date"] = advance.CreatedAt.ToString("dd MMM yyyy"),
                ["rejected_by"] = emp.FullName,
                ["reason"] = dto.Comments,
                ["action_date"] = DateTime.UtcNow.ToString("dd MMM yyyy hh:mm tt 'UTC'"),
            },
            advance.Employee.Email);

        return (await GetByIdAsync(id))!;
    }

    public async Task<AdvanceDto> CancelAsync(Guid id)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var currentEmployee = await _tenant.GetCurrentEmployeeAsync();
        var advance = await _db.AdvancePayments
            .Include(x => x.Employee)
            .FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId)
            ?? throw new KeyNotFoundException("Advance not found");

        if (advance.Status != AdvanceStatus.Pending)
            throw new InvalidOperationException("You can only cancel an advance while it is pending.");

        if (advance.EmployeeId != currentEmployee.Id)
            throw new UnauthorizedAccessException("Only the person who raised this request can cancel.");

        advance.Status = AdvanceStatus.Cancelled;

        _db.ActivityComments.Add(new ActivityComment
        {
            Id = Guid.NewGuid(),
            AdvancePaymentId = id,
            CommentByEmployeeId = currentEmployee.Id,
            Text = "Cancelled by submitter.",
            ActionType = CommentActionType.Cancelled
        });

        await _db.SaveChangesAsync();

        return (await GetByIdAsync(id))!;
    }

    public async Task<AdvanceDisburseValidationDto> ValidateDisburseAsync(Guid id, decimal paidAmount)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var advance = await _db.AdvancePayments
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId)
            ?? throw new KeyNotFoundException("Advance not found");

        if (advance.Status != AdvanceStatus.Approved && advance.Status != AdvanceStatus.PartiallyDisbursed)
            throw new InvalidOperationException("Advance must be approved before disbursement.");

        var remainingOnAdvance = advance.Amount - advance.PaidAmount;
        var balanceSetting = await _db.OrganizationSettings
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.OrganizationId == orgId && s.Key == "balanceCap");
        var balanceCap = balanceSetting != null ? decimal.Parse(balanceSetting.Value) : 0;

        if (paidAmount > remainingOnAdvance)
            return new AdvanceDisburseValidationDto(balanceCap, remainingOnAdvance, paidAmount, false,
                $"Amount cannot exceed remaining advance (₹{remainingOnAdvance:N2}).");

        return new AdvanceDisburseValidationDto(balanceCap, remainingOnAdvance, paidAmount, true, null);
    }

    public async Task<AdvanceDto> DisburseAsync(Guid id, ProcessPaymentRequest dto)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var emp = await _tenant.GetCurrentEmployeeAsync();
        var advance = await _db.AdvancePayments
            .Include(x => x.Employee)
            .FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId)
            ?? throw new KeyNotFoundException("Advance not found");

        if (advance.Status != AdvanceStatus.Approved && advance.Status != AdvanceStatus.PartiallyDisbursed)
            throw new InvalidOperationException("Advance must be approved before disbursement.");

        if (string.IsNullOrWhiteSpace(dto.PaymentReference))
            throw new InvalidOperationException("Payment reference is required.");

        var remainingBefore = advance.Amount - advance.PaidAmount;
        var paidAmount = dto.PaidAmount > 0 ? dto.PaidAmount : advance.Amount;
        if (paidAmount > remainingBefore)
            throw new InvalidOperationException($"Paid amount (₹{paidAmount:N2}) cannot exceed the remaining balance (₹{remainingBefore:N2}).");

        advance.PaidAmount += paidAmount;
        advance.PaymentReference = dto.PaymentReference.Trim();
        advance.DisbursedAt = DateTime.UtcNow;
        advance.Status = advance.PaidAmount >= advance.Amount ? AdvanceStatus.Disbursed : AdvanceStatus.PartiallyDisbursed;
        var balanceDueAfter = Math.Max(0, advance.Amount - advance.PaidAmount);

        _db.ActivityComments.Add(new ActivityComment
        {
            Id = Guid.NewGuid(),
            AdvancePaymentId = id,
            CommentByEmployeeId = emp.Id,
            Text = $"Disbursed. Amount: ₹{paidAmount:N2}. Ref: {dto.PaymentReference}",
            ActionType = CommentActionType.PaymentProcessed
        });

        await _db.SaveChangesAsync();
        await _email.SendNotificationAsync(
            Constants.EmailTemplateKeys.AdvanceDisbursed,
            new Dictionary<string, string>
            {
                ["link_type"] = "detail",
                ["entity_type"] = "advance",
                ["entity_api_id"] = advance.Id.ToString(),
                ["employee_name"] = advance.Employee.FullName,
                ["advance_id"] = advance.AdvanceCode,
                ["purpose"] = advance.Purpose,
                ["amount"] = $"₹{advance.Amount:N2}",
                ["paid_amount"] = $"₹{paidAmount:N2}",
                ["balance_due"] = $"₹{balanceDueAfter:N2}",
                ["request_date"] = advance.CreatedAt.ToString("dd MMM yyyy"),
                ["payment_reference"] = dto.PaymentReference ?? "",
                ["processed_by"] = emp.FullName,
                ["payment_notes"] = dto.Notes ?? "",
                ["action_date"] = DateTime.UtcNow.ToString("dd MMM yyyy hh:mm tt 'UTC'"),
            },
            advance.Employee.Email);

        return (await GetByIdAsync(id))!;
    }

    public async Task<List<AdvanceDto>> GetEmployeeHistoryAsync(Guid employeeId)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var items = await _db.AdvancePayments
            .Include(x => x.Employee)
            .Include(x => x.Comments).ThenInclude(c => c.CommentByEmployee)
            .Where(x => x.OrganizationId == orgId && x.EmployeeId == employeeId)
            .OrderByDescending(x => x.CreatedAt)
            .AsNoTracking()
            .ToListAsync();

        return items.Select(MapToDto).ToList();
    }

    /// <summary>
    /// When rejecting after approve, restore what was reserved: full amount if nothing disbursed yet,
    /// otherwise only the remaining undisbursed balance.
    /// </summary>
    private async Task AddDeltaToBalanceCapAsync(Guid orgId, decimal delta)
    {
        if (delta <= 0) return;
        var balanceSetting = await _db.OrganizationSettings
            .FirstOrDefaultAsync(s => s.OrganizationId == orgId && s.Key == "balanceCap");

        var current = balanceSetting != null ? decimal.Parse(balanceSetting.Value) : 0m;
        current += delta;

        if (balanceSetting != null)
        {
            balanceSetting.Value = current.ToString();
            balanceSetting.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            _db.OrganizationSettings.Add(new OrganizationSetting
            {
                Id = Guid.NewGuid(),
                OrganizationId = orgId,
                Key = "balanceCap",
                Value = current.ToString(),
                UpdatedAt = DateTime.UtcNow
            });
        }
    }

    private static AdvanceDto MapToDto(AdvancePayment a) => new(
        a.Id, a.AdvanceCode, a.EmployeeId, a.Employee.FullName,
        a.Employee.Department ?? "",
        a.Amount, a.PaidAmount, a.Purpose, a.Status.ToString(),
        a.PaymentReference, a.CreatedAt,
        a.Comments.OrderBy(c => c.CreatedAt).Select(c => new CommentDto(
            c.Id, c.CommentByEmployee.FullName, c.Text, c.ActionType.ToString(), c.CreatedAt
        )).ToList()
    );
}