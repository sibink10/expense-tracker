namespace QubiqonFinanceHub.API.DTOs;

public record GraphUserDto(
    string Id,
    string? DisplayName,
    string? UserPrincipalName,
    string? Mail,
    string? JobTitle,
    string? Department,
    string? EmployeeId);
