using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class DocumentType
{
    public int Id { get; set; }

    public Guid OrganizationId { get; set; }

    public string Name { get; set; } = null!;

    public string Code { get; set; } = null!;

    public int DisplayOrder { get; set; }

    public bool IsActive { get; set; }

    public int? CategoryId { get; set; }

    public virtual DocumentCategory? Category { get; set; }

    public virtual ICollection<EmployeeDocument> EmployeeDocuments { get; set; } = new List<EmployeeDocument>();

    public virtual Organization Organization { get; set; } = null!;
}
