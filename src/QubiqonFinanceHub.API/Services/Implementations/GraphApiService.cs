using Microsoft.Identity.Client;
using QubiqonFinanceHub.API.DTOs;
using QubiqonFinanceHub.API.Services.Interfaces;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace QubiqonFinanceHub.API.Services.Implementations;

public class GraphApiService : IGraphApiService
{
    private const string EntraSyncSelect =
        "id,displayName,givenName,surname,mail,userPrincipalName,jobTitle,department,officeLocation," +
        "mobilePhone,businessPhones,faxNumber,preferredLanguage,employeeId,employeeType,employeeHireDate," +
        "accountEnabled,userType,companyName,usageLocation,streetAddress,city,state,postalCode,country," +
        "createdDateTime,lastPasswordChangeDateTime,otherMails,onPremisesSamAccountName,onPremisesDomainName";

    private const string EntraSyncExpand =
        "manager($select=id,displayName,mail,userPrincipalName,jobTitle)";

    private static readonly string InitialUsersUrl =
        $"https://graph.microsoft.com/v1.0/users?$top=999&$select={EntraSyncSelect}&$expand={EntraSyncExpand}";

    private readonly HttpClient _httpClient;
    private readonly IConfiguration _config;

    public GraphApiService(IHttpClientFactory httpClientFactory, IConfiguration config)
    {
        _httpClient = httpClientFactory.CreateClient("GraphClient");
        _config = config;
    }

    public bool IsConfigured()
    {
        var tenantId = _config["ServerApp:TenantId"];
        var clientId = _config["ServerApp:ClientId"];
        var clientSecret = _config["ServerApp:ClientSecret"];
        return !string.IsNullOrWhiteSpace(tenantId)
            && !string.IsNullOrWhiteSpace(clientId)
            && !string.IsNullOrWhiteSpace(clientSecret);
    }

    public async Task<IReadOnlyList<GraphUserDto>> GetUsersAsync(CancellationToken cancellationToken = default)
    {
        var users = await ListAllUsersForSyncAsync(cancellationToken);
        return users
            .Select(ParseGraphUserDto)
            .Where(u => u != null)
            .Cast<GraphUserDto>()
            .ToList();
    }

    public async Task<IReadOnlyList<JsonElement>> ListAllUsersForSyncAsync(CancellationToken cancellationToken = default)
    {
        var token = await GetGraphTokenForAppAsync();
        var results = new List<JsonElement>();
        var nextUrl = InitialUsersUrl;

        while (!string.IsNullOrEmpty(nextUrl))
        {
            using var request = new HttpRequestMessage(HttpMethod.Get, nextUrl);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            request.Headers.Add("ConsistencyLevel", "eventual");

            using var response = await _httpClient.SendAsync(request, cancellationToken);
            response.EnsureSuccessStatusCode();

            var graphResponse = await response.Content.ReadFromJsonAsync<GraphUsersPageResponse>(cancellationToken);
            if (graphResponse?.Value != null)
            {
                foreach (var user in graphResponse.Value)
                    results.Add(user);
            }

            nextUrl = graphResponse?.ODataNextLink;
        }

        return results;
    }

    private static GraphUserDto? ParseGraphUserDto(JsonElement user)
    {
        if (!user.TryGetProperty("id", out var idProp) || string.IsNullOrWhiteSpace(idProp.GetString()))
            return null;

        return new GraphUserDto(
            idProp.GetString()!,
            GetString(user, "displayName"),
            GetString(user, "userPrincipalName"),
            GetString(user, "mail"),
            GetString(user, "jobTitle"),
            GetString(user, "department"),
            GetString(user, "employeeId"));
    }

    private static string? GetString(JsonElement el, string name) =>
        el.TryGetProperty(name, out var prop) && prop.ValueKind == JsonValueKind.String
            ? prop.GetString()
            : null;

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

    private sealed class GraphUsersPageResponse
    {
        [JsonPropertyName("value")]
        public List<JsonElement>? Value { get; set; }

        [JsonPropertyName("@odata.nextLink")]
        public string? ODataNextLink { get; set; }
    }
}
