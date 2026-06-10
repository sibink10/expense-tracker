using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace QubiqonFinanceHub.API.Auth.Shared;

[Table("auth_sessions", Schema = "dbo")]
public class AuthSession
{
    [Key]
    [Column("session_id")]
    public Guid SessionId { get; set; }

    [Required, MaxLength(36)]
    [Column("user_oid")]
    public string UserOid { get; set; } = "";

    [Required, MaxLength(256)]
    [Column("email")]
    public string Email { get; set; } = "";

    [Required]
    [Column("azure_access_token")]
    public string AzureAccessToken { get; set; } = "";

    [Required]
    [Column("refresh_token")]
    public string RefreshToken { get; set; } = "";

    [Column("access_token_expiry")]
    public DateTime AccessTokenExpiry { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("expires_at")]
    public DateTime ExpiresAt { get; set; }
}
