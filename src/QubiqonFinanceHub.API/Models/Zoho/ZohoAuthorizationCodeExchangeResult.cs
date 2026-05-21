using System.Net;

namespace QubiqonFinanceHub.API.Models.Zoho;

public class ZohoAuthorizationCodeExchangeResult
{
    public bool Success { get; init; }
    public HttpStatusCode StatusCode { get; init; }
    public ZohoTokenResponseDto? Tokens { get; init; }
    public string? RawBody { get; init; }
}
