using Amazon.S3;
using Amazon.S3.Model;
using GlobalScout.Application.Abstractions.Files;
using GlobalScout.SharedKernel;
using Microsoft.Extensions.Options;

namespace GlobalScout.Infrastructure.Files;

internal sealed class S3FileStorage(
    IAmazonS3 s3,
    IOptions<ObjectStorageOptions> options) : IFileStorage, IFileStorageInitializer
{
    private readonly ObjectStorageOptions _options = options.Value;

    public Task<Result<FileUploadUrl>> CreateUploadUrlAsync(
        FileUploadRequest request,
        CancellationToken cancellationToken)
    {
        _ = cancellationToken;
        var expiresAt = DateTimeOffset.UtcNow.AddMinutes(_options.UploadUrlMinutes);
        var url = s3.GetPreSignedURL(new GetPreSignedUrlRequest
        {
            BucketName = _options.BucketName,
            Key = request.StorageKey,
            Verb = HttpVerb.PUT,
            ContentType = request.ContentType,
            Expires = expiresAt.UtcDateTime,
            Protocol = PresignedUrlProtocol()
        });

        return Task.FromResult(Result.Success(new FileUploadUrl(
            request.StorageKey,
            url,
            "PUT",
            expiresAt)));
    }

    public Task<Result<FileReadUrl>> CreateReadUrlAsync(
        string storageKey,
        CancellationToken cancellationToken)
    {
        _ = cancellationToken;
        var expiresAt = DateTimeOffset.UtcNow.AddMinutes(_options.ReadUrlMinutes);
        var url = s3.GetPreSignedURL(new GetPreSignedUrlRequest
        {
            BucketName = _options.BucketName,
            Key = storageKey,
            Verb = HttpVerb.GET,
            Expires = expiresAt.UtcDateTime,
            Protocol = PresignedUrlProtocol()
        });

        return Task.FromResult(Result.Success(new FileReadUrl(url, expiresAt)));
    }

    public async Task<Result<FileObjectMetadata>> GetMetadataAsync(
        string storageKey,
        CancellationToken cancellationToken)
    {
        try
        {
            var response = await s3.GetObjectMetadataAsync(
                _options.BucketName,
                storageKey,
                cancellationToken);

            return Result.Success(new FileObjectMetadata(
                response.Headers.ContentLength,
                response.Headers.ContentType));
        }
        catch (AmazonS3Exception ex) when (IsMissingObject(ex))
        {
            return Result.Failure<FileObjectMetadata>(
                Error.NotFound("FileStorage.ObjectNotFound", "Uploaded file was not found."));
        }
    }

    public async Task<Result> DeleteAsync(string storageKey, CancellationToken cancellationToken)
    {
        await s3.DeleteObjectAsync(_options.BucketName, storageKey, cancellationToken);
        return Result.Success();
    }

    public async Task EnsureReadyAsync(CancellationToken cancellationToken)
    {
        if (!_options.CreateBucketIfMissing)
        {
            return;
        }

        try
        {
            await s3.GetBucketLocationAsync(_options.BucketName, cancellationToken);
        }
        catch (AmazonS3Exception ex) when (IsMissingBucket(ex))
        {
            await s3.PutBucketAsync(new PutBucketRequest
            {
                BucketName = _options.BucketName
            }, cancellationToken);
        }
    }

    private static bool IsMissingObject(AmazonS3Exception ex) =>
        ex.StatusCode == System.Net.HttpStatusCode.NotFound
        || string.Equals(ex.ErrorCode, "NoSuchKey", StringComparison.OrdinalIgnoreCase);

    private static bool IsMissingBucket(AmazonS3Exception ex) =>
        ex.StatusCode == System.Net.HttpStatusCode.NotFound
        || string.Equals(ex.ErrorCode, "NoSuchBucket", StringComparison.OrdinalIgnoreCase);

    private Protocol PresignedUrlProtocol()
    {
        if (Uri.TryCreate(_options.EndpointUrl, UriKind.Absolute, out var endpoint)
            && endpoint.Scheme.Equals(Uri.UriSchemeHttp, StringComparison.OrdinalIgnoreCase))
        {
            return Protocol.HTTP;
        }

        return Protocol.HTTPS;
    }
}
