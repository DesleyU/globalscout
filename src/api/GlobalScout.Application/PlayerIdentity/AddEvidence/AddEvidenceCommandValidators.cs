using FluentValidation;
using GlobalScout.Domain.PlayerIdentity;

namespace GlobalScout.Application.PlayerIdentity.AddEvidence;

internal sealed class InitiateEvidenceUploadCommandValidator : AbstractValidator<InitiateEvidenceUploadCommand>
{
    private const long MaxEvidenceBytes = 10L * 1024 * 1024;
    private static readonly string[] AllowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".pdf"];

    private static readonly HashSet<string> AllowedContentTypes =
    [
        "image/jpeg",
        "image/png",
        "image/webp",
        "application/pdf"
    ];

    public InitiateEvidenceUploadCommandValidator()
    {
        RuleFor(c => c.FileName).NotEmpty();

        RuleFor(c => c.FileName)
            .Must(name => AllowedExtensions.Contains(Path.GetExtension(name).ToLowerInvariant()))
            .WithMessage("Invalid file extension. Only JPG, PNG, WEBP, and PDF files are allowed.");

        RuleFor(c => c.ContentType)
            .Must(type => string.IsNullOrWhiteSpace(type) || AllowedContentTypes.Contains(type.ToLowerInvariant()))
            .WithMessage("Invalid file type. Only JPG, PNG, WEBP, and PDF files are allowed.");

        RuleFor(c => c.ContentLength)
            .GreaterThan(0)
            .LessThanOrEqualTo(MaxEvidenceBytes)
            .WithMessage("Evidence file size must not exceed 10 MB.");
    }
}

internal sealed class CompleteEvidenceUploadCommandValidator : AbstractValidator<CompleteEvidenceUploadCommand>
{
    private static readonly EvidenceType[] FileEvidenceTypes =
    [
        EvidenceType.RosterListing,
        EvidenceType.FederationCard,
        EvidenceType.ClubId,
        EvidenceType.Passport,
        EvidenceType.CountryPersonalId,
        EvidenceType.Other
    ];

    public CompleteEvidenceUploadCommandValidator()
    {
        RuleFor(c => c.StorageKey).NotEmpty();
        RuleFor(c => c.FileName).NotEmpty();
        RuleFor(c => c.Type).Must(type => FileEvidenceTypes.Contains(type));
        RuleFor(c => c.Note).MaximumLength(500).When(c => !string.IsNullOrWhiteSpace(c.Note));
    }
}

internal sealed class AddLinkEvidenceCommandValidator : AbstractValidator<AddLinkEvidenceCommand>
{
    private static readonly EvidenceType[] LinkEvidenceTypes =
    [
        EvidenceType.ProfileUrl,
        EvidenceType.SocialAccount,
        EvidenceType.RosterListing
    ];

    public AddLinkEvidenceCommandValidator()
    {
        RuleFor(c => c.Type).Must(type => LinkEvidenceTypes.Contains(type));
        RuleFor(c => c.Url).NotEmpty().Must(BeValidHttpUrl).WithMessage("A valid HTTP or HTTPS URL is required.");
        RuleFor(c => c.Note).MaximumLength(500).When(c => !string.IsNullOrWhiteSpace(c.Note));
    }

    private static bool BeValidHttpUrl(string url) =>
        Uri.TryCreate(url, UriKind.Absolute, out var parsed)
        && (parsed.Scheme == Uri.UriSchemeHttp || parsed.Scheme == Uri.UriSchemeHttps);
}
