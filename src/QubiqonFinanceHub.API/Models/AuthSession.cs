using System;
using System.Collections.Generic;

namespace QubiqonFinanceHub.API.Models;

public partial class AuthSession
{
    public Guid SessionId { get; set; }

    public string UserOid { get; set; } = null!;

    public string Email { get; set; } = null!;

    public string AzureAccessToken { get; set; } = null!;

    public string RefreshToken { get; set; } = null!;

    public DateTime AccessTokenExpiry { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime ExpiresAt { get; set; }
}
