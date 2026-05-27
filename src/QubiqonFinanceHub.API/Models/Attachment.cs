using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class Attachment
{
    public Guid Id { get; set; }

    public Guid? RequestId { get; set; }

    public string Name { get; set; } = null!;

    public string Url { get; set; } = null!;

    public long Size { get; set; }

    public string MimeType { get; set; } = null!;

    public Guid UploadedBy { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public bool IsDeleted { get; set; }

    public virtual MaterialRequest? Request { get; set; }

    public virtual Employee UploadedByNavigation { get; set; } = null!;
}
