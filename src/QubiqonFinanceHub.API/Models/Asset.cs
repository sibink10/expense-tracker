using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class Asset
{
    public int Id { get; set; }

    public string AssetCode { get; set; } = null!;

    public int AssetTypeId { get; set; }

    public Guid OrganizationId { get; set; }

    public string? BusinessUnit { get; set; }

    public string? Location { get; set; }

    public string? Brand { get; set; }

    public string? Model { get; set; }

    public string? SerialNumber { get; set; }

    public DateOnly? PurchaseDate { get; set; }

    public decimal? PurchaseCost { get; set; }

    public DateOnly? WarrantyExpiry { get; set; }

    public string Status { get; set; } = null!;

    public Guid? AssignedTo { get; set; }

    public DateTime? AssignedAt { get; set; }

    public DateTime? ReturnedAt { get; set; }

    public string? Notes { get; set; }

    public string? ExtraFields { get; set; }

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<AssetHistory> AssetHistories { get; set; } = new List<AssetHistory>();

    public virtual AssetType AssetType { get; set; } = null!;

    public virtual Employee? AssignedToNavigation { get; set; }
}
