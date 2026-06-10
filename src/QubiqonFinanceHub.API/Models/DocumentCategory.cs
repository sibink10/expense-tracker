using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class DocumentCategory
{
    public int Id { get; set; }

    public string Code { get; set; } = null!;

    public string Name { get; set; } = null!;

    public int DisplayOrder { get; set; }

    public bool IsActive { get; set; }

    public virtual ICollection<DocumentType> DocumentTypes { get; set; } = new List<DocumentType>();
}
