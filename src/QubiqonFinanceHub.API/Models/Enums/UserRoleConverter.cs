using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace QubiqonFinanceHub.API.Models.Enums;

public static class UserRoleConverter
{
    public static ValueConverter<UserRole, string> Instance { get; } = new(
        role => role.ToString(),
        value => FromDb(value));

    public static UserRole FromDb(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return UserRole.Employee;

        var normalized = value.Trim().Replace('-', '_');
        if (Enum.TryParse<UserRole>(normalized, ignoreCase: true, out var role))
            return role;

        return UserRole.Employee;
    }

    public static bool IsQhrmsRole(UserRole role) =>
        role.ToString().StartsWith("QHRMS", StringComparison.OrdinalIgnoreCase);

    public static bool IsQhrmsRoleCode(string? value) =>
        !string.IsNullOrWhiteSpace(value)
        && value.Trim().StartsWith("QHRMS", StringComparison.OrdinalIgnoreCase);
}
