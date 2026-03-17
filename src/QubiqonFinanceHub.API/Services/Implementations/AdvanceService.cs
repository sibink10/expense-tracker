using Microsoft.EntityFrameworkCore;
using QubiqonFinanceHub.API.Data;
using QubiqonFinanceHub.API.DTOs;
using QubiqonFinanceHub.API.Models.Constants;
using QubiqonFinanceHub.API.Models.Entities;
using QubiqonFinanceHub.API.Models.Enums;
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

        var code = await _codeGen.GenerateCodeAsync(orgId, "advance");

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

        var reviewRoles = new[] { UserRole.Admin, UserRole.Finance, UserRole.Approver };
        var reviewers = await _db.Employees
            .Where(e => e.OrganizationId == orgId &&
                        e.IsActive &&
                        !e.IsDelete &&
                        !string.IsNullOrWhiteSpace(e.Email) &&
                        reviewRoles.Contains(e.Role))
            .Select(e => e.Email)
            .Distinct()
            .ToListAsync();

        if (reviewers.Count > 0)
        {
            await _email.SendNotificationAsync(
                Constants.EmailTemplateKeys.AdvanceSubmitted,
                new Dictionary<string, string>
                {
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
        q = f.Desc ? q.OrderByDescending(x => x.CreatedAt) : q.OrderBy(x => x.CreatedAt);
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

        if (advance.Status != AdvanceStatus.Pending)
            throw new InvalidOperationException($"Cannot approve advance in '{advance.Status}' status.");

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

        await _email.SendNotificationAsync(
            Constants.EmailTemplateKeys.AdvanceApproved,
            new Dictionary<string, string>
            {
                ["employee_name"] = advance.Employee.FullName,
                ["advance_id"] = advance.AdvanceCode,
                ["purpose"] = advance.Purpose,
                ["amount"] = $"₹{advance.Amount:N2}",
                ["request_date"] = advance.CreatedAt.ToString("dd MMM yyyy"),
                ["approver_name"] = emp.FullName,
                ["approver_comments"] = dto.Comments ?? "",
                ["action_date"] = DateTime.UtcNow.ToString("dd MMM yyyy hh:mm tt 'UTC'"),
            },
            advance.Employee.Email);

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

    public async Task<AdvanceDto> DisburseAsync(Guid id, ProcessPaymentRequest dto)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var emp = await _tenant.GetCurrentEmployeeAsync();
        var advance = await _db.AdvancePayments
            .Include(x => x.Employee)
            .FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId)
            ?? throw new KeyNotFoundException("Advance not found");

        if (advance.Status != AdvanceStatus.Approved)
            throw new InvalidOperationException("Advance must be approved before disbursement.");

        advance.Status = AdvanceStatus.Disbursed;
        advance.PaymentReference = dto.PaymentReference;
        advance.DisbursedAt = DateTime.UtcNow;

        _db.ActivityComments.Add(new ActivityComment
        {
            Id = Guid.NewGuid(),
            AdvancePaymentId = id,
            CommentByEmployeeId = emp.Id,
            Text = $"Disbursed. Ref: {dto.PaymentReference}",
            ActionType = CommentActionType.PaymentProcessed
        });

        await _db.SaveChangesAsync();

        await _email.SendNotificationAsync(
            Constants.EmailTemplateKeys.AdvanceDisbursed,
            new Dictionary<string, string>
            {
                ["employee_name"] = advance.Employee.FullName,
                ["advance_id"] = advance.AdvanceCode,
                ["purpose"] = advance.Purpose,
                ["amount"] = $"₹{advance.Amount:N2}",
                ["request_date"] = advance.CreatedAt.ToString("dd MMM yyyy"),
                ["payment_reference"] = dto.PaymentReference,
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

    private static AdvanceDto MapToDto(AdvancePayment a) => new(
        a.Id, a.AdvanceCode, a.EmployeeId, a.Employee.FullName,
        a.Employee.Department ?? "",
        a.Amount, a.Purpose, a.Status.ToString(),
        a.PaymentReference, a.CreatedAt,
        a.Comments.OrderBy(c => c.CreatedAt).Select(c => new CommentDto(
            c.Id, c.CommentByEmployee.FullName, c.Text, c.ActionType.ToString(), c.CreatedAt
        )).ToList()
    );
}