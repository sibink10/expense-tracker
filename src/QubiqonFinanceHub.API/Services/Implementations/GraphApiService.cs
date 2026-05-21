using Microsoft.Identity.Client;
using QubiqonFinanceHub.API.DTOs;
using QubiqonFinanceHub.API.Services.Interfaces;
using System.Net.Http.Headers;
using System.Text.Json.Serialization;

namespace QubiqonFinanceHub.API.Services.Implementations;

public class GraphApiService : IGraphApiService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _config;

    public GraphApiService(IHttpClientFactory httpClientFactory, IConfiguration config)
    {
        _httpClient = httpClientFactory.CreateClient("GraphClient");
        _config = config;
    }

    public async Task<IReadOnlyList<GraphUserDto>> GetUsersAsync(CancellationToken cancellationToken = default)
    {
        var token = await GetGraphTokenForAppAsync();

        using var request = new HttpRequestMessage(
            HttpMethod.Get,
            "https://graph.microsoft.com/v1.0/users?$select=id,displayName,userPrincipalName,mail,jobTitle,department,employeeId&$top=999");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        request.Headers.Add("ConsistencyLevel", "eventual");

        using var response = await _httpClient.SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();

        var graphResponse = await response.Content.ReadFromJsonAsync<GraphUsersResponse>(cancellationToken);

        return graphResponse?.Value?
            .Where(user => !string.IsNullOrWhiteSpace(user.Id))
            .Select(user => new GraphUserDto(
                user.Id!,
                user.DisplayName,
                user.UserPrincipalName,
                user.Mail,
                user.JobTitle,
                user.Department,
                user.EmployeeId))
            .ToList() ?? [];
    }

    private async Task<string> GetGraphTokenForAppAsync()
    {
        var tenantId = _config["ServerApp:TenantId"];
        var clientId = _config["ServerApp:ClientId"];
        var clientSecret = _config["ServerApp:ClientSecret"];

        if (string.IsNullOrWhiteSpace(tenantId) ||
            string.IsNullOrWhiteSpace(clientId) ||
            string.IsNullOrWhiteSpace(clientSecret))
        {
            throw new InvalidOperationException("Missing required ServerApp Graph credentials.");
        }

        var app = ConfidentialClientApplicationBuilder
            .Create(clientId)
            .WithClientSecret(clientSecret)
            .WithAuthority($"https://login.microsoftonline.com/{tenantId}")
            .Build();

        var result = await app
            .AcquireTokenForClient(["https://graph.microsoft.com/.default"])
            .ExecuteAsync();

        return result.AccessToken;
    }

    private sealed class GraphUsersResponse
    {
        [JsonPropertyName("value")]
        public List<GraphUserItem>? Value { get; set; }
    }

    private sealed class GraphUserItem
    {
        [JsonPropertyName("id")]
        public string? Id { get; set; }

        [JsonPropertyName("displayName")]
        public string? DisplayName { get; set; }

        [JsonPropertyName("userPrincipalName")]
        public string? UserPrincipalName { get; set; }

        [JsonPropertyName("mail")]
        public string? Mail { get; set; }

        [JsonPropertyName("jobTitle")]
        public string? JobTitle { get; set; }

        [JsonPropertyName("department")]
        public string? Department { get; set; }

        [JsonPropertyName("employeeId")]
        public string? EmployeeId { get; set; }
    }
}
