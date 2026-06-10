using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class EmployeeDocument
{
    public Guid Id { get; set; }

    public Guid EmployeeId { get; set; }

    public Guid OrganizationId { get; set; }

    public int DocumentTypeId { get; set; }

    public string FileName { get; set; } = null!;

    public string? ContentType { get; set; }

    public long FileSizeBytes { get; set; }

    public string BlobName { get; set; } = null!;

    public string Url { get; set; } = null!;

    public Guid UploadedByEmployeeId { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public bool IsDeleted { get; set; }

    public virtual DocumentType DocumentType { get; set; } = null!;

    public virtual Employee Employee { get; set; } = null!;

    public virtual Organization Organization { get; set; } = null!;

    public virtual Employee UploadedByEmployee { get; set; } = null!;
}
