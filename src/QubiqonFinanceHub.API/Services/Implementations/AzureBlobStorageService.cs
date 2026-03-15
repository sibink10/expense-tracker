using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using QubiqonFinanceHub.API.Services.Interfaces;

namespace QubiqonFinanceHub.API.Services.Implementations;

public class AzureBlobStorageService : IStorageService
{
    private readonly BlobServiceClient _blobServiceClient;
    private readonly string _containerName;

    public AzureBlobStorageService(IConfiguration config)
    {
        _blobServiceClient = new BlobServiceClient(config["AzureStorage:ConnectionString"]);
        _containerName = config["AzureStorage:ContainerName"]!;
    }

    public async Task<string> UploadAsync(string folder, Guid entityId, IFormFile file)
    {
        var containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);
        await containerClient.CreateIfNotExistsAsync(PublicAccessType.None);

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        var fileName = $"{Guid.NewGuid()}{extension}";
        var blobPath = $"{folder}/{entityId}/{fileName}";
        var blobClient = containerClient.GetBlobClient(blobPath);

        await using var stream = file.OpenReadStream();
        await blobClient.UploadAsync(stream, new BlobHttpHeaders
        {
            ContentType = file.ContentType
        });

        return blobClient.Uri.ToString();
    }

    public async Task DeleteAsync(string fileUrl)
    {
        var uri = new Uri(fileUrl);
        var blobPath = string.Join("/", uri.AbsolutePath.TrimStart('/').Split('/').Skip(1));
        var containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);
        var blobClient = containerClient.GetBlobClient(blobPath);
        await blobClient.DeleteIfExistsAsync();
    }

    public string GenerateSasUrl(string fileUrl, int expiryMinutes = 30)
    {
        var uri = new Uri(fileUrl);
        var blobPath = string.Join("/", uri.AbsolutePath.TrimStart('/').Split('/').Skip(1));

        var containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);
        var blobClient = containerClient.GetBlobClient(blobPath);

        var sasUri = blobClient.GenerateSasUri(Azure.Storage.Sas.BlobSasPermissions.Read,
            DateTimeOffset.UtcNow.AddMinutes(expiryMinutes));

        return sasUri.ToString();
    }
}