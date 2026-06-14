using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Domain.PlayerIdentity;

namespace GlobalScout.Application.PlayerIdentity.AddEvidence;

public sealed class InitiateEvidenceUploadCommand : ICommand<InitiateEvidenceUploadResult>
{
    public Guid UserId { get; init; }

    public string FileName { get; init; } = string.Empty;

    public string ContentType { get; init; } = string.Empty;

    public long ContentLength { get; init; }
}

public sealed record InitiateEvidenceUploadResult(
    string StorageKey,
    string UploadUrl,
    string HttpMethod,
    DateTimeOffset ExpiresAt);

public sealed class CompleteEvidenceUploadCommand : ICommand<VerificationEvidenceDto>
{
    public Guid UserId { get; init; }

    public string StorageKey { get; init; } = string.Empty;

    public string FileName { get; init; } = string.Empty;

    public string ContentType { get; init; } = string.Empty;

    public EvidenceType Type { get; init; }

    public string? Note { get; init; }
}

public sealed class AddLinkEvidenceCommand : ICommand<VerificationEvidenceDto>
{
    public Guid UserId { get; init; }

    public EvidenceType Type { get; init; }

    public string Url { get; init; } = string.Empty;

    public string? Note { get; init; }
}
