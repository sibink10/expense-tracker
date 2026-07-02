using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using QubiqonFinanceHub.API.Data;
using QubiqonFinanceHub.API.DTOs;
using QubiqonFinanceHub.API.Models.Entities;
using QubiqonFinanceHub.API.Models.Enums;
using QubiqonFinanceHub.API.Services.Interfaces;

namespace QubiqonFinanceHub.API.Services.EntraSync;

public interface IEntraEmployeeSyncService
{
    Task<EntraSyncStartResponse> StartSyncAsync(Guid organizationId, CancellationToken ct = default);
    EntraSyncJobDto? GetJob(Guid jobId);
}

public class EntraEmployeeSyncService : IEntraEmployeeSyncService
{
    private const int ChunkSize = 50;
    private const string DefaultRoleCode = "Employee";

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IGraphApiService _graphApi;
    private readonly EntraSyncJobStore _jobStore;
    private readonly ILogger<EntraEmployeeSyncService> _logger;

    public EntraEmployeeSyncService(
        IServiceScopeFactory scopeFactory,
        IGraphApiService graphApi,
        EntraSyncJobStore jobStore,
        ILogger<EntraEmployeeSyncService> logger)
    {
        _scopeFactory = scopeFactory;
        _graphApi = graphApi;
        _jobStore = jobStore;
        _logger = logger;
    }

    public Task<EntraSyncStartResponse> StartSyncAsync(Guid organizationId, CancellationToken ct = default)
    {
        var job = _jobStore.TryStartJob(organizationId)
            ?? throw new InvalidOperationException("Unable to start sync job.");

        if (_jobStore.TryClaimExecution(job.JobId))
        {
            _ = Task.Run(() => ExecuteSyncFromEntraAsync(job.JobId, organizationId, CancellationToken.None), ct);
        }

        return Task.FromResult(new EntraSyncStartResponse(job.JobId, job.Status));
    }

    public EntraSyncJobDto? GetJob(Guid jobId)
    {
        var job = _jobStore.GetJob(jobId);
        return job == null ? null : MapJob(job);
    }

    private async Task ExecuteSyncFromEntraAsync(Guid jobId, Guid organizationId, CancellationToken ct)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<FinanceHubDbContext>();

            _jobStore.MarkRunning(jobId, 0);

            var graphUsers = await _graphApi.ListAllUsersForSyncAsync(ct);
            _jobStore.MarkRunning(jobId, graphUsers.Count);

            var employeeRole = await db.Roles
                .FirstOrDefaultAsync(r => r.IsActive && r.Code == DefaultRoleCode, ct)
                ?? throw new InvalidOperationException($"Role '{DefaultRoleCode}' is not available.");

            var oidToEmployeeId = new Dictionary<string, Guid>(StringComparer.OrdinalIgnoreCase);
            var managerLinks = new List<(Guid EmployeeId, string ManagerOid)>();

            var created = 0;
            var updated = 0;
            var skipped = 0;
            var processed = 0;

            foreach (var chunk in graphUsers.Chunk(ChunkSize))
            {
                var seenEmails = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

                foreach (var userJson in chunk)
                {
                    var parseResult = TryParseGraphUser(userJson, out var oid, out var email, out var snapshot);
                    if (!parseResult)
                    {
                        skipped++;
                        processed++;
                        continue;
                    }

                    var normalizedEmail = email!.ToLowerInvariant();
                    if (!seenEmails.Add(normalizedEmail))
                    {
                        skipped++;
                        processed++;
                        continue;
                    }

                    var entraEmployeeId = Guid.Parse(oid!);

                    var existing = await db.Employees
                        .Include(e => e.FinanceRole!)
                            .ThenInclude(fr => fr.Role)
                        .FirstOrDefaultAsync(e =>
                            e.OrganizationId == organizationId
                            && !e.IsDelete
                            && (e.EntraObjectId == oid || e.Email.ToLower() == normalizedEmail), ct);

                    if (existing != null && UserRoleConverter.IsQhrmsRoleCode(existing.FinanceRole?.Role?.Code))
                    {
                        oidToEmployeeId[oid!] = existing.Id;
                        skipped++;
                        processed++;
                        continue;
                    }

                    oidToEmployeeId[oid!] = entraEmployeeId;

                    Guid resolvedEmployeeId;

                    if (existing == null)
                    {
                        var emp = MapNewEmployee(userJson, organizationId, entraEmployeeId, oid!, email!, snapshot);
                        db.Employees.Add(emp);
                        await UpsertFinanceRoleAsync(db, entraEmployeeId, employeeRole.Id);
                        resolvedEmployeeId = entraEmployeeId;
                        created++;
                    }
                    else
                    {
                        ApplyGraphFields(existing, userJson, oid!, email!, snapshot);
                        await UpsertFinanceRoleAsync(db, existing.Id, employeeRole.Id);
                        oidToEmployeeId[oid!] = existing.Id;
                        resolvedEmployeeId = existing.Id;
                        updated++;
                    }

                    var managerOid = GetManagerOid(userJson);
                    if (!string.IsNullOrWhiteSpace(managerOid))
                        managerLinks.Add((resolvedEmployeeId, managerOid));

                    processed++;
                }

                await db.SaveChangesAsync(ct);
                _jobStore.UpdateProgress(jobId, processed, created, updated, skipped);
            }

            foreach (var (employeeId, managerOid) in managerLinks)
            {
                if (!oidToEmployeeId.TryGetValue(managerOid, out var managerId))
                    continue;

                var emp = await db.Employees
                    .FirstOrDefaultAsync(e => e.Id == employeeId && e.OrganizationId == organizationId, ct);
                if (emp != null && emp.ManagerId != managerId)
                {
                    emp.ManagerId = managerId;
                    emp.UpdatedAt = DateTime.UtcNow;
                }
            }

            await db.SaveChangesAsync(ct);
            _jobStore.MarkCompleted(jobId, created, updated, skipped);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Entra sync job {JobId} failed for organization {OrganizationId}", jobId, organizationId);
            _jobStore.MarkFailed(jobId, ex.Message);
        }
    }

    private static bool TryParseGraphUser(JsonElement user, out string? oid, out string? email, out string snapshot)
    {
        snapshot = user.GetRawText();
        oid = null;
        email = null;

        if (!user.TryGetProperty("id", out var idProp) || string.IsNullOrWhiteSpace(idProp.GetString()))
            return false;

        oid = idProp.GetString()!.Trim();

        var mail = GetString(user, "mail");
        var upn = GetString(user, "userPrincipalName");
        email = !string.IsNullOrWhiteSpace(mail) ? mail.Trim() : upn?.Trim();

        return !string.IsNullOrWhiteSpace(email) && Guid.TryParse(oid, out _);
    }

    private static Employee MapNewEmployee(
        JsonElement user, Guid organizationId, Guid employeeId, string oid, string email, string snapshot)
    {
        var fullName = ResolveFullName(user);
        return new Employee
        {
            Id = employeeId,
            OrganizationId = organizationId,
            EntraObjectId = oid,
            FullName = fullName,
            FirstName = GetString(user, "givenName"),
            Email = email,
            Department = GetString(user, "department"),
            Designation = GetString(user, "jobTitle"),
            EmployeeCode = GetString(user, "employeeId"),
            PersonalMobile = ResolveMobile(user),
            DateOfJoining = ParseDateOnly(GetString(user, "employeeHireDate")),
            EmploymentType = GetString(user, "employeeType"),
            IsActive = GetBool(user, "accountEnabled") ?? true,
            IsDelete = false,
            CreatedAt = DateTime.UtcNow
        };
    }

    private static void ApplyGraphFields(Employee emp, JsonElement user, string oid, string email, string snapshot)
    {
        emp.EntraObjectId = oid;
        emp.FullName = ResolveFullName(user);
        emp.FirstName = GetString(user, "givenName");
        emp.Email = email;
        emp.Department = GetString(user, "department");
        emp.Designation = GetString(user, "jobTitle");
        emp.EmployeeCode = GetString(user, "employeeId");
        emp.PersonalMobile = ResolveMobile(user);
        emp.DateOfJoining = ParseDateOnly(GetString(user, "employeeHireDate"));
        emp.EmploymentType = GetString(user, "employeeType");

        var accountEnabled = GetBool(user, "accountEnabled");
        if (accountEnabled.HasValue)
            emp.IsActive = accountEnabled.Value;

        emp.UpdatedAt = DateTime.UtcNow;
    }

    private static async Task UpsertFinanceRoleAsync(
        FinanceHubDbContext db, Guid employeeId, int roleId)
    {
        var existing = await db.FinanceEmployeeRoles
            .FirstOrDefaultAsync(r => r.EmployeeId == employeeId);

        if (existing == null)
        {
            db.FinanceEmployeeRoles.Add(new FinanceEmployeeRole
            {
                Id = Guid.NewGuid(),
                EmployeeId = employeeId,
                RoleId = roleId,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            });
            return;
        }

        existing.RoleId = roleId;
        existing.IsActive = true;
        existing.UpdatedAt = DateTime.UtcNow;
    }

    private static string ResolveFullName(JsonElement user)
    {
        var displayName = GetString(user, "displayName");
        if (!string.IsNullOrWhiteSpace(displayName))
            return displayName.Trim();

        var given = GetString(user, "givenName");
        var surname = GetString(user, "surname");
        var combined = $"{given} {surname}".Trim();
        return string.IsNullOrWhiteSpace(combined) ? "Unknown" : combined;
    }

    private static string? ResolveMobile(JsonElement user)
    {
        var mobile = GetString(user, "mobilePhone");
        if (!string.IsNullOrWhiteSpace(mobile))
            return mobile.Trim();

        if (user.TryGetProperty("businessPhones", out var phones)
            && phones.ValueKind == JsonValueKind.Array)
        {
            foreach (var phone in phones.EnumerateArray())
            {
                if (phone.ValueKind == JsonValueKind.String
                    && !string.IsNullOrWhiteSpace(phone.GetString()))
                {
                    return phone.GetString()!.Trim();
                }
            }
        }

        return null;
    }

    private static string? GetManagerOid(JsonElement user)
    {
        if (!user.TryGetProperty("manager", out var manager)
            || manager.ValueKind != JsonValueKind.Object)
            return null;

        return GetString(manager, "id");
    }

    private static string? GetString(JsonElement el, string name) =>
        el.TryGetProperty(name, out var prop) && prop.ValueKind == JsonValueKind.String
            ? prop.GetString()
            : null;

    private static bool? GetBool(JsonElement el, string name) =>
        el.TryGetProperty(name, out var prop) && prop.ValueKind is JsonValueKind.True or JsonValueKind.False
            ? prop.GetBoolean()
            : null;

    private static DateOnly? ParseDateOnly(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        if (DateOnly.TryParse(value, out var date))
            return date;

        if (DateTime.TryParse(value, out var dt))
            return DateOnly.FromDateTime(dt);

        return null;
    }

    private static EntraSyncJobDto MapJob(EntraSyncJob job) => new(
        job.JobId,
        job.Status,
        job.TotalUsers,
        job.ProcessedUsers,
        job.Created,
        job.Updated,
        job.Skipped,
        job.Error,
        job.CreatedAt,
        job.CompletedAt);
}
