namespace GlobalScout.Infrastructure.Auth.Email;

internal sealed class EmailOptions
{
    public const string SectionName = "Email";

    public string Provider { get; init; } = "Ses";

    public string Region { get; init; } = "us-east-1";

    public string FromAddress { get; init; } = "no-reply@globalscout.eu";

    public string? EndpointUrl { get; init; }

    public string? AccessKey { get; init; }

    public string? SecretKey { get; init; }

    public int VerificationResendCooldownSeconds { get; init; } = 60;
}
