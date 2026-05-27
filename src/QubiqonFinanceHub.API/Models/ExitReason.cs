using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class ExitReason
{
    public int Id { get; set; }

    public Guid OrganizationId { get; set; }

    public string Reason { get; set; } = null!;

    public string Type { get; set; } = null!;

    public bool IsActive { get; set; }

    public virtual Organization Organization { get; set; } = null!;

    public virtual ICollection<ResignationRequest> ResignationRequests { get; set; } = new List<ResignationRequest>();
}
