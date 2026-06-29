namespace QubiqonFinanceHub.API.Services.EntraSync;

public sealed class EntraSyncJob
{
    public Guid JobId { get; init; }
    public Guid OrganizationId { get; init; }
    public string Status { get; set; } = "pending";
    public int? TotalUsers { get; set; }
    public int ProcessedUsers { get; set; }
    public int Created { get; set; }
    public int Updated { get; set; }
    public int Skipped { get; set; }
    public string? Error { get; set; }
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
    public bool ExecutionStarted { get; set; }
}

public sealed class EntraSyncJobStore
{
    private static readonly TimeSpan JobTtl = TimeSpan.FromHours(1);

    private readonly object _lock = new();
    private readonly Dictionary<Guid, EntraSyncJob> _jobs = new();
    private readonly Dictionary<Guid, Guid> _activeJobByOrg = new();

    public EntraSyncJob? TryStartJob(Guid organizationId)
    {
        PurgeExpired();

        lock (_lock)
        {
            if (_activeJobByOrg.TryGetValue(organizationId, out var existingJobId)
                && _jobs.TryGetValue(existingJobId, out var existing)
                && IsActive(existing))
            {
                return existing;
            }

            var job = new EntraSyncJob
            {
                JobId = Guid.NewGuid(),
                OrganizationId = organizationId,
                Status = "pending"
            };

            _jobs[job.JobId] = job;
            _activeJobByOrg[organizationId] = job.JobId;
            return job;
        }
    }

    public bool TryClaimExecution(Guid jobId)
    {
        lock (_lock)
        {
            if (!_jobs.TryGetValue(jobId, out var job) || job.ExecutionStarted)
                return false;
            job.ExecutionStarted = true;
            return true;
        }
    }

    public EntraSyncJob? GetJob(Guid jobId)
    {
        PurgeExpired();

        lock (_lock)
        {
            return _jobs.TryGetValue(jobId, out var job) ? job : null;
        }
    }

    public void MarkRunning(Guid jobId, int totalUsers)
    {
        lock (_lock)
        {
            if (!_jobs.TryGetValue(jobId, out var job)) return;
            job.Status = "running";
            job.TotalUsers = totalUsers;
        }
    }

    public void UpdateProgress(Guid jobId, int processedUsers, int created, int updated, int skipped)
    {
        lock (_lock)
        {
            if (!_jobs.TryGetValue(jobId, out var job)) return;
            job.ProcessedUsers = processedUsers;
            job.Created = created;
            job.Updated = updated;
            job.Skipped = skipped;
        }
    }

    public void MarkCompleted(Guid jobId, int created, int updated, int skipped)
    {
        lock (_lock)
        {
            if (!_jobs.TryGetValue(jobId, out var job)) return;
            job.Status = "completed";
            job.Created = created;
            job.Updated = updated;
            job.Skipped = skipped;
            job.ProcessedUsers = job.TotalUsers ?? job.ProcessedUsers;
            job.CompletedAt = DateTime.UtcNow;
            _activeJobByOrg.Remove(job.OrganizationId);
        }
    }

    public void MarkFailed(Guid jobId, string error)
    {
        lock (_lock)
        {
            if (!_jobs.TryGetValue(jobId, out var job)) return;
            job.Status = "failed";
            job.Error = error;
            job.CompletedAt = DateTime.UtcNow;
            _activeJobByOrg.Remove(job.OrganizationId);
        }
    }

    private static bool IsActive(EntraSyncJob job) =>
        job.Status is "pending" or "running";

    private void PurgeExpired()
    {
        var cutoff = DateTime.UtcNow - JobTtl;

        lock (_lock)
        {
            var expiredIds = _jobs
                .Where(kv => kv.Value.CreatedAt < cutoff)
                .Select(kv => kv.Key)
                .ToList();

            foreach (var jobId in expiredIds)
            {
                if (_jobs.TryGetValue(jobId, out var job))
                    _activeJobByOrg.Remove(job.OrganizationId);
                _jobs.Remove(jobId);
            }
        }
    }
}
