using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class App
{
    public Guid Id { get; set; }

    public string Name { get; set; } = null!;

    public virtual ICollection<Role> Roles { get; set; } = new List<Role>();
}
