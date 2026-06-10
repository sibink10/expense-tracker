using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using QubiqonFinanceHub.API.Auth.Shared;

namespace QubiqonFinanceHub.API.Auth.Finance;

public interface IAppJwtService
{
    (string Token, int ExpiresInSeconds) CreateToken(string oid, string email, string role);
}

public class AppJwtService(IOptions<GlobalAuthOptions> options) : IAppJwtService
{
    public (string Token, int ExpiresInSeconds) CreateToken(string oid, string email, string role)
    {
        var cfg = options.Value;
        var secret = cfg.AppJwtSecret;
        if (string.IsNullOrWhiteSpace(secret) || secret.Length < 32)
            throw new InvalidOperationException("GlobalAuth:AppJwtSecret must be at least 32 characters.");

        var expiresIn = TimeSpan.FromDays(cfg.AppJwtExpiryDays);
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, oid),
            new("oid", oid),
            new(ClaimTypes.Email, email),
            new("email", email),
            new(ClaimTypes.Role, role),
            new("role", role),
        };

        var token = new JwtSecurityToken(
            issuer: "qubiqon-finance",
            audience: "qubiqon-finance-api",
            claims: claims,
            expires: DateTime.UtcNow.Add(expiresIn),
            signingCredentials: creds);

        return (new JwtSecurityTokenHandler().WriteToken(token), (int)expiresIn.TotalSeconds);
    }
}
