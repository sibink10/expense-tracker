using System.Net;

namespace QubiqonFinanceHub.API.Models.Zoho;

public sealed class ZohoOAuthException : InvalidOperationException
{
    public ZohoOAuthException(
        string message,
        string? zohoError = null,
        string? zohoErrorDescription = null,
        HttpStatusCode statusCode = HttpStatusCode.BadRequest,
        string? rawBody = null,
        Exception? innerException = null)
        : base(message, innerException)
    {
        ZohoError = zohoError;
        ZohoErrorDescription = zohoErrorDescription;
        StatusCode = statusCode;
        RawBody = rawBody;
    }

    public string? ZohoError { get; }
    public string? ZohoErrorDescription { get; }
    public HttpStatusCode StatusCode { get; }
    public string? RawBody { get; }
}
