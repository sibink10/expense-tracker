using Microsoft.EntityFrameworkCore;
using QubiqonFinanceHub.API.Data;
using QubiqonFinanceHub.API.DTOs;
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
        var orgId = _tenant.GetCurrentOrganizationId();
        var emp = await _tenant.GetCurrentEmployeeAsync();
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

        _log.LogInformation("Advance {Code} created by {Employee}", code, emp.FullName);
        return (await GetByIdAsync(advance.Id))!;
    }

    public async Task<AdvanceDto?> GetByIdAsync(Guid id)
    {
        var orgId = _tenant.GetCurrentOrganizationId();
        var a = await _db.AdvancePayments
            .Include(x => x.Employee)
            .Include(x => x.Comments).ThenInclude(c => c.CommentByEmployee)
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId);

        return a == null ? null : MapToDto(a);
    }

    public async Task<PaginatedResult<AdvanceDto>> ListAsync(FilterParams f, bool myOnly = false)
    {
        var orgId = _tenant.GetCurrentOrganizationId();
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
        var orgId = _tenant.GetCurrentOrganizationId();
        var emp = await _tenant.GetCurrentEmployeeAsync();
        var advance = await _db.AdvancePayments
            .FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId)
            ?? throw new KeyNotFoundException("Advance not found");

        if (advance.Status != AdvanceStatus.Pending)
            throw new InvalidOperationException($"Cannot approve advance in '{advance.Status}' status.");

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
        return (await GetByIdAsync(id))!;
    }

    public async Task<AdvanceDto> RejectAsync(Guid id, RejectRequest dto)
    {
        var orgId = _tenant.GetCurrentOrganizationId();
        var emp = await _tenant.GetCurrentEmployeeAsync();
        var advance = await _db.AdvancePayments
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
        return (await GetByIdAsync(id))!;
    }

    public async Task<AdvanceDto> DisburseAsync(Guid id, ProcessPaymentRequest dto)
    {
        var orgId = _tenant.GetCurrentOrganizationId();
        var emp = await _tenant.GetCurrentEmployeeAsync();
        var advance = await _db.AdvancePayments
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
        return (await GetByIdAsync(id))!;
    }

    public async Task<List<AdvanceDto>> GetEmployeeHistoryAsync(Guid employeeId)
    {
        var orgId = _tenant.GetCurrentOrganizationId();
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