namespace GlobalScout.Infrastructure.Files;

internal sealed class ObjectStorageOptions
{
    public const string SectionName = "ObjectStorage";

    public string Provider { get; init; } = "S3";

    public string BucketName { get; init; } = "globalscout-media";

    public string Region { get; init; } = "us-east-1";

    public string? EndpointUrl { get; init; }

    public string? AccessKey { get; init; }

    public string? SecretKey { get; init; }

    public bool ForcePathStyle { get; init; }

    public int UploadUrlMinutes { get; init; } = 15;

    public int ReadUrlMinutes { get; init; } = 10;

    public bool CreateBucketIfMissing { get; init; }
}
