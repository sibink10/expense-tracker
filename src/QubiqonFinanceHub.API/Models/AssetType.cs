using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class AssetType
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public string? Fields { get; set; }

    public bool IsActive { get; set; }

    public Guid OrganizationId { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual ICollection<Asset> Assets { get; set; } = new List<Asset>();
}
