using Microsoft.EntityFrameworkCore;
using QubiqonFinanceHub.API.Data;
using QubiqonFinanceHub.API.DTOs;
using QubiqonFinanceHub.API.Models.Constants;
using QubiqonFinanceHub.API.Models.Entities;
using QubiqonFinanceHub.API.Models.Enums;
using QubiqonFinanceHub.API.Services.Interfaces;

namespace QubiqonFinanceHub.API.Services.Implementations;

public class ForecastService : IForecastService
{
    private readonly FinanceHubDbContext _db;
    private readonly ITenantService _tenant;
    private readonly IEmailService _email;
    private readonly IStorageService _storage;
    private readonly ILogger<ForecastService> _log;

    public ForecastService(FinanceHubDbContext db, ITenantService tenant, IEmailService email, IStorageService storage, ILogger<ForecastService> log)
    {
        _db = db;
        _tenant = tenant;
        _email = email;
        _storage = storage;
        _log = log;
    }

    public async Task<ForecastDto> CreateAsync(CreateForecastRequest dto)
    {
        ValidateForecastFields(dto.Title, dto.Purpose, dto.ExpectedAmount, dto.ExpectedExpenseDate);
        var orgId = await _tenant.GetCurrentOrganizationId();
        var emp = await _tenant.GetCurrentEmployeeAsync();
        var forecastId = Guid.NewGuid();
        var documents = await UploadDocumentsAsync(orgId, forecastId, emp.Id, ResolveUploadedFiles(dto.SupportingDocuments, dto.SupportingDocument));

        var forecast = new Forecast
        {
            Id = forecastId,
            OrganizationId = orgId,
            Title = dto.Title.Trim(),
            Purpose = dto.Purpose.Trim(),
            Description = string.IsNullOrWhiteSpace(dto.Description) ? string.Empty : dto.Description.Trim(),
            ExpectedAmount = dto.ExpectedAmount,
            ExpectedExpenseDate = dto.ExpectedExpenseDate,
            Notes = string.IsNullOrWhiteSpace(dto.Notes) ? null : dto.Notes.Trim(),
            CreatedByEmployeeId = emp.Id,
            Status = ForecastStatus.Submitted,
            CreatedAt = DateTime.UtcNow
        };

        foreach (var document in documents)
            forecast.Documents.Add(document);

        forecast.Comments.Add(new ActivityComment
        {
            Id = Guid.NewGuid(),
            ForecastId = forecast.Id,
            CommentByEmployeeId = emp.Id,
            Text = "Forecast submitted.",
            ActionType = CommentActionType.Submitted,
            CreatedAt = DateTime.UtcNow
        });

        _db.Forecasts.Add(forecast);
        await _db.SaveChangesAsync();

        var reviewers = await GetReviewerEmailsAsync(orgId, UserRole.Approver);
        if (reviewers.Count > 0)
        {
            await _email.SendNotificationAsync(Constants.EmailTemplateKeys.ForecastSubmitted, BuildEmailVars(forecast, emp, "approve"), string.Join(",", reviewers));
        }

        _log.LogInformation("Forecast {ForecastId} created by {Employee}", forecast.Id, emp.FullName);
        return (await GetByIdAsync(forecast.Id))!;
    }

    public async Task<ForecastDto> UpdateAsync(Guid id, UpdateForecastRequest dto)
    {
        ValidateForecastFields(dto.Title, dto.Purpose, dto.ExpectedAmount, dto.ExpectedExpenseDate);
        var orgId = await _tenant.GetCurrentOrganizationId();
        var emp = await _tenant.GetCurrentEmployeeAsync();
        var forecast = await _db.Forecasts
            .Include(x => x.Documents)
            .FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId)
            ?? throw new KeyNotFoundException("Forecast not found");

        if (forecast.CreatedByEmployeeId != emp.Id)
            throw new UnauthorizedAccessException("Only the person who raised this forecast can edit.");

        if (forecast.Status != ForecastStatus.Submitted && forecast.Status != ForecastStatus.Rejected)
            throw new InvalidOperationException("This forecast cannot be edited in its current status.");

        var wasRejected = forecast.Status == ForecastStatus.Rejected;

        forecast.Title = dto.Title.Trim();
        forecast.Purpose = dto.Purpose.Trim();
        forecast.Description = string.IsNullOrWhiteSpace(dto.Description) ? string.Empty : dto.Description.Trim();
        forecast.ExpectedAmount = dto.ExpectedAmount;
        forecast.ExpectedExpenseDate = dto.ExpectedExpenseDate;
        forecast.Notes = string.IsNullOrWhiteSpace(dto.Notes) ? null : dto.Notes.Trim();
        forecast.UpdatedAt = DateTime.UtcNow;

        if (wasRejected)
            forecast.Status = ForecastStatus.Submitted;

        var documents = await UploadDocumentsAsync(orgId, forecast.Id, emp.Id, ResolveUploadedFiles(dto.SupportingDocuments, dto.SupportingDocument));
        _db.RequestDocuments.AddRange(documents);

        _db.ActivityComments.Add(new ActivityComment
        {
            Id = Guid.NewGuid(),
            ForecastId = forecast.Id,
            CommentByEmployeeId = emp.Id,
            Text = wasRejected ? "Rejected forecast updated and resubmitted." : "Forecast updated.",
            ActionType = wasRejected ? CommentActionType.Submitted : CommentActionType.General,
            CreatedAt = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();

        if (wasRejected)
        {
            var reviewers = await GetReviewerEmailsAsync(orgId, UserRole.Approver);
            if (reviewers.Count > 0)
            {
                await _email.SendNotificationAsync(Constants.EmailTemplateKeys.ForecastSubmitted, BuildEmailVars(forecast, emp, "approve"), string.Join(",", reviewers));
            }
        }

        return (await GetByIdAsync(id))!;
    }

    public async Task<ForecastDto?> GetByIdAsync(Guid id)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var forecast = await BaseQuery(orgId)
            .FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId);

        return forecast == null ? null : MapToDto(forecast);
    }

    public async Task<PaginatedResult<ForecastDto>> ListAsync(FilterParams f, bool myOnly = false)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var q = BaseQuery(orgId).Where(x => x.OrganizationId == orgId);

        if (myOnly)
        {
            var currentEmployeeId = _tenant.GetCurrentEmployeeId();
            q = q.Where(x => x.CreatedByEmployeeId == currentEmployeeId);
        }

        if (!string.IsNullOrWhiteSpace(f.Status) && Enum.TryParse<ForecastStatus>(f.Status, true, out var status))
            q = q.Where(x => x.Status == status);

        if (!string.IsNullOrWhiteSpace(f.Search))
        {
            var s = f.Search.ToLower();
            q = q.Where(x =>
                x.Title.ToLower().Contains(s) ||
                x.Purpose.ToLower().Contains(s) ||
                x.CreatedByEmployee.FullName.ToLower().Contains(s));
        }

        q = NormalizeSortBy(f.SortBy) switch
        {
            "title" => f.Desc ? q.OrderByDescending(x => x.Title) : q.OrderBy(x => x.Title),
            "purpose" => f.Desc ? q.OrderByDescending(x => x.Purpose) : q.OrderBy(x => x.Purpose),
            "expectedamount" => f.Desc ? q.OrderByDescending(x => x.ExpectedAmount) : q.OrderBy(x => x.ExpectedAmount),
            "expectedexpensedate" => f.Desc ? q.OrderByDescending(x => x.ExpectedExpenseDate) : q.OrderBy(x => x.ExpectedExpenseDate),
            "status" => f.Desc ? q.OrderByDescending(x => x.Status) : q.OrderBy(x => x.Status),
            "createdby" => f.Desc ? q.OrderByDescending(x => x.CreatedByEmployee.FullName) : q.OrderBy(x => x.CreatedByEmployee.FullName),
            _ => f.Desc ? q.OrderByDescending(x => x.CreatedAt) : q.OrderBy(x => x.CreatedAt),
        };

        var total = await q.CountAsync();
        var items = await q.Skip((f.Page - 1) * f.PageSize).Take(f.PageSize).ToListAsync();
        return new PaginatedResult<ForecastDto>(items.Select(MapToDto).ToList(), total, f.Page, f.PageSize);
    }

    public async Task<List<ForecastSummaryDto>> ListApprovedAsync()
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        return await _db.Forecasts
            .Where(x => x.OrganizationId == orgId && x.Status == ForecastStatus.Approved)
            .OrderByDescending(x => x.CreatedAt)
            .AsNoTracking()
            .Select(x => new ForecastSummaryDto(x.Id, x.Title, x.Purpose, x.Description, x.ExpectedAmount, x.ExpectedExpenseDate, x.Status.ToString()))
            .ToListAsync();
    }

    public async Task<ForecastDto> SubmitAsync(Guid id)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var emp = await _tenant.GetCurrentEmployeeAsync();
        var forecast = await _db.Forecasts.FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId)
            ?? throw new KeyNotFoundException("Forecast not found");

        if (forecast.Status != ForecastStatus.Draft && forecast.Status != ForecastStatus.Rejected)
            throw new InvalidOperationException("Only draft or rejected forecasts can be submitted.");

        forecast.Status = ForecastStatus.Submitted;
        forecast.UpdatedAt = DateTime.UtcNow;
        _db.ActivityComments.Add(new ActivityComment
        {
            Id = Guid.NewGuid(),
            ForecastId = forecast.Id,
            CommentByEmployeeId = emp.Id,
            Text = "Forecast submitted for approval.",
            ActionType = CommentActionType.Submitted,
            CreatedAt = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();

        var reviewers = await GetReviewerEmailsAsync(orgId, UserRole.Approver);
        if (reviewers.Count > 0)
        {
            await _email.SendNotificationAsync(Constants.EmailTemplateKeys.ForecastSubmitted, BuildEmailVars(forecast, emp, "approve"), string.Join(",", reviewers));
        }

        return (await GetByIdAsync(id))!;
    }

    public async Task<ForecastDto> ApproveAsync(Guid id, ApproveRequest dto)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var emp = await _tenant.GetCurrentEmployeeAsync();
        var forecast = await _db.Forecasts
            .Include(x => x.CreatedByEmployee)
            .FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId)
            ?? throw new KeyNotFoundException("Forecast not found");

        if (forecast.Status != ForecastStatus.Submitted)
            throw new InvalidOperationException("Forecast can only be approved while submitted.");

        if (forecast.CreatedByEmployeeId == emp.Id)
            throw new UnauthorizedAccessException("Submitter cannot approve their own forecast.");

        forecast.Status = ForecastStatus.Approved;
        forecast.UpdatedAt = DateTime.UtcNow;
        _db.ActivityComments.Add(new ActivityComment
        {
            Id = Guid.NewGuid(),
            ForecastId = forecast.Id,
            CommentByEmployeeId = emp.Id,
            Text = string.IsNullOrWhiteSpace(dto.Comments) ? "Forecast approved." : dto.Comments,
            ActionType = CommentActionType.Approved,
            CreatedAt = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();

        if (!string.IsNullOrWhiteSpace(forecast.CreatedByEmployee.Email))
            await _email.SendNotificationAsync(Constants.EmailTemplateKeys.ForecastApproved, BuildEmailVars(forecast, emp, "detail"), forecast.CreatedByEmployee.Email);

        return (await GetByIdAsync(id))!;
    }

    public async Task<ForecastDto> RejectAsync(Guid id, RejectRequest dto)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var emp = await _tenant.GetCurrentEmployeeAsync();
        var forecast = await _db.Forecasts
            .Include(x => x.CreatedByEmployee)
            .FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId)
            ?? throw new KeyNotFoundException("Forecast not found");

        if (forecast.Status != ForecastStatus.Submitted)
            throw new InvalidOperationException("Forecast can only be rejected while submitted.");

        if (forecast.CreatedByEmployeeId == emp.Id)
            throw new UnauthorizedAccessException("Submitter cannot reject their own forecast.");

        forecast.Status = ForecastStatus.Rejected;
        forecast.UpdatedAt = DateTime.UtcNow;
        _db.ActivityComments.Add(new ActivityComment
        {
            Id = Guid.NewGuid(),
            ForecastId = forecast.Id,
            CommentByEmployeeId = emp.Id,
            Text = dto.Comments,
            ActionType = CommentActionType.Rejected,
            CreatedAt = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();

        if (!string.IsNullOrWhiteSpace(forecast.CreatedByEmployee.Email))
            await _email.SendNotificationAsync(Constants.EmailTemplateKeys.ForecastRejected, BuildEmailVars(forecast, emp, "detail"), forecast.CreatedByEmployee.Email);

        return (await GetByIdAsync(id))!;
    }

    public async Task<ForecastDto> CancelAsync(Guid id)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var emp = await _tenant.GetCurrentEmployeeAsync();
        var forecast = await _db.Forecasts
            .Include(x => x.CreatedByEmployee)
            .FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == orgId)
            ?? throw new KeyNotFoundException("Forecast not found");

        if (forecast.Status != ForecastStatus.Submitted)
            throw new InvalidOperationException("Only submitted forecasts can be cancelled.");

        if (forecast.CreatedByEmployeeId != emp.Id)
            throw new UnauthorizedAccessException("Only the submitter can cancel this forecast.");

        forecast.Status = ForecastStatus.Cancelled;
        forecast.UpdatedAt = DateTime.UtcNow;
        _db.ActivityComments.Add(new ActivityComment
        {
            Id = Guid.NewGuid(),
            ForecastId = forecast.Id,
            CommentByEmployeeId = emp.Id,
            Text = "Cancelled by submitter.",
            ActionType = CommentActionType.Cancelled,
            CreatedAt = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();

        return (await GetByIdAsync(id))!;
    }

    public async Task<string> GetDocumentUrlAsync(Guid id, Guid documentId)
    {
        var orgId = await _tenant.GetCurrentOrganizationId();
        var document = await _db.RequestDocuments
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == documentId && x.ForecastId == id && x.OrganizationId == orgId)
            ?? throw new KeyNotFoundException("Document not found");

        return _storage.GenerateSasUrl(document.FileUrl);
    }

    private IQueryable<Forecast> BaseQuery(Guid orgId) =>
        _db.Forecasts
            .Include(x => x.CreatedByEmployee)
            .Include(x => x.Documents)
            .Include(x => x.Comments).ThenInclude(c => c.CommentByEmployee)
            .Include(x => x.ExpenseRequests).ThenInclude(e => e.Employee)
            .Where(x => x.OrganizationId == orgId)
            .AsNoTracking();

    private static ForecastDto MapToDto(Forecast f) => new(
        f.Id,
        f.Title,
        f.Purpose,
        f.Description,
        f.ExpectedAmount,
        f.ExpectedExpenseDate,
        f.Notes,
        f.Status.ToString(),
        f.CreatedByEmployeeId,
        f.CreatedByEmployee.FullName,
        f.CreatedAt,
        f.ExpenseRequests.Count,
        f.Comments
            .OrderBy(c => c.CreatedAt)
            .Select(c => new CommentDto(c.Id, c.CommentByEmployee.FullName, c.Text, c.ActionType.ToString(), c.CreatedAt))
            .ToList(),
        f.Documents
            .OrderBy(x => x.CreatedAt)
            .Select(x => new DocumentDto(x.Id, x.FileName, x.ContentType, x.FileSizeBytes, x.CreatedAt))
            .ToList(),
        f.ExpenseRequests
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new ForecastExpenseDto(x.Id, x.ExpenseCode, x.Amount, x.BillDate, x.Status.ToString(), x.Employee.FullName, x.CreatedAt))
            .ToList()
    );

    private async Task<List<RequestDocument>> UploadDocumentsAsync(Guid orgId, Guid forecastId, Guid uploadedByEmployeeId, IReadOnlyCollection<IFormFile> files)
    {
        var documents = new List<RequestDocument>(files.Count);
        foreach (var file in files)
        {
            var fileUrl = await _storage.UploadAsync(StorageFolders.Forecast, forecastId, file);
            documents.Add(new RequestDocument
            {
                Id = Guid.NewGuid(),
                OrganizationId = orgId,
                ForecastId = forecastId,
                UploadedByEmployeeId = uploadedByEmployeeId,
                FileName = file.FileName,
                ContentType = file.ContentType,
                FileSizeBytes = file.Length,
                FileUrl = fileUrl,
                CreatedAt = DateTime.UtcNow
            });
        }

        return documents;
    }

    private async Task<List<string>> GetReviewerEmailsAsync(Guid orgId, UserRole role) =>
        await _db.Employees
            .Where(e => e.OrganizationId == orgId && e.IsActive && !e.IsDelete && !string.IsNullOrWhiteSpace(e.Email) && e.Role == role)
            .Select(e => e.Email)
            .Distinct()
            .ToListAsync();

    private static Dictionary<string, string> BuildEmailVars(Forecast forecast, Employee actor, string linkType) => new()
    {
        ["link_type"] = linkType,
        ["entity_type"] = "forecast",
        ["entity_api_id"] = forecast.Id.ToString(),
        ["forecast_title"] = forecast.Title,
        ["purpose"] = forecast.Purpose,
        ["amount"] = $"₹{forecast.ExpectedAmount:N2}",
        ["expected_expense_date"] = forecast.ExpectedExpenseDate.ToString("dd MMM yyyy"),
        ["status"] = forecast.Status.ToString(),
        ["action_by"] = actor.FullName,
        ["action_date"] = DateTime.UtcNow.ToString("dd MMM yyyy hh:mm tt 'UTC'")
    };

    private static List<IFormFile> ResolveUploadedFiles(IEnumerable<IFormFile>? files, IFormFile? legacyFile)
    {
        var resolved = files?
            .Where(x => x != null && x.Length > 0)
            .ToList() ?? new List<IFormFile>();

        if (legacyFile != null && legacyFile.Length > 0 && !resolved.Contains(legacyFile))
            resolved.Add(legacyFile);

        return resolved;
    }

    private static void ValidateForecastFields(string title, string purpose, decimal amount, DateTime expectedDate)
    {
        if (string.IsNullOrWhiteSpace(title)) throw new InvalidOperationException("Forecast title is required.");
        if (string.IsNullOrWhiteSpace(purpose)) throw new InvalidOperationException("Purpose is required.");
        if (amount <= 0) throw new InvalidOperationException("Expected amount must be greater than zero.");
        if (expectedDate == default) throw new InvalidOperationException("Expected expense date is required.");
    }

    private static string NormalizeSortBy(string? value) => (value ?? "CreatedAt").Replace(" ", "").ToLowerInvariant();
}
