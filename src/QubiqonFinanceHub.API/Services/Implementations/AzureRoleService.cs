using Azure.Identity;
using Microsoft.Graph;
using Microsoft.Graph.Models;
using QubiqonFinanceHub.API.Services.Interfaces;
using QubiqonFinanceHub.API.Models.Enums;

namespace QubiqonFinanceHub.API.Services.Implementations;

public class AzureRoleService : IAzureRoleService
{
    private readonly GraphServiceClient _graphClient;
    private readonly string _servicePrincipalId;
    private readonly Dictionary<UserRole, Guid> _roleMap;

    public AzureRoleService(IConfiguration config)
    {
        var tenantId        = config["ServerApp:TenantId"]!;
        var clientId        = config["ServerApp:ClientId"]!;
        var clientSecret    = config["ServerApp:ClientSecret"]!;
        _servicePrincipalId = config["ServerApp:ServicePrincipalId"]!;

        var credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
        _graphClient = new GraphServiceClient(credential);

        _roleMap = new Dictionary<UserRole, Guid>
        {
            { UserRole.Employee, Guid.Parse(config["AppRoles:Employee"]!) },
            { UserRole.Approver, Guid.Parse(config["AppRoles:Approver"]!) },
            { UserRole.Finance,  Guid.Parse(config["AppRoles:Finance"]!) },
            { UserRole.Admin,    Guid.Parse(config["AppRoles:Admin"]!) },
        };
    }

    public async Task AssignRoleAsync(string azureObjectId, UserRole role)
    {
        await RemoveAllRolesAsync(azureObjectId);

        if (!_roleMap.TryGetValue(role, out var appRoleId))
            throw new ArgumentException($"Role {role} not mapped to Azure AD");

        var assignment = new AppRoleAssignment
        {
            PrincipalId = Guid.Parse(azureObjectId),
            ResourceId  = Guid.Parse(_servicePrincipalId),
            AppRoleId   = appRoleId
        };

        await _graphClient.Users[azureObjectId]
            .AppRoleAssignments
            .PostAsync(assignment);
    }

    public async Task RemoveAllRolesAsync(string azureObjectId)
    {
        var assignments = await _graphClient.Users[azureObjectId]
            .AppRoleAssignments
            .GetAsync();

        if (assignments?.Value == null) return;

        foreach (var assignment in assignments.Value)
        {
            await _graphClient.Users[azureObjectId]
                .AppRoleAssignments[assignment.Id]
                .DeleteAsync();
        }
    }
}