using FluentValidation;

namespace GlobalScout.Application.Media.UploadPhoto;

internal sealed class InitiatePhotoUploadCommandValidator : AbstractValidator<InitiatePhotoUploadCommand>
{
    private const long MaxPhotoBytes = 15L * 1024 * 1024;
    private static readonly string[] AllowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];

    private static readonly HashSet<string> AllowedContentTypes =
    [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp"
    ];

    public InitiatePhotoUploadCommandValidator()
    {
        RuleFor(c => c.FileName).NotEmpty();

        RuleFor(c => c.FileName)
            .Must(name => AllowedExtensions.Contains(Path.GetExtension(name).ToLowerInvariant()))
            .WithMessage("Photo must be a JPG, PNG, or WebP image.");

        RuleFor(c => c.ContentType)
            .Must(type => string.IsNullOrWhiteSpace(type) || AllowedContentTypes.Contains(type.ToLowerInvariant()))
            .WithMessage("Photo must be a JPG, PNG, or WebP image.");

        RuleFor(c => c.FileName)
            .Must(name => !HasSuspiciousFileName(name))
            .WithMessage("Invalid filename detected!");

        RuleFor(c => c.ContentLength)
            .GreaterThan(0)
            .WithMessage("No photo file provided.")
            .LessThanOrEqualTo(MaxPhotoBytes)
            .WithMessage($"File size must not exceed {MaxPhotoBytes / (1024 * 1024)} MB.");
    }

    private static bool HasSuspiciousFileName(string name)
    {
        if (name.Contains("..", StringComparison.Ordinal))
        {
            return true;
        }

        foreach (char ch in Path.GetFileName(name))
        {
            if (ch is '<' or '>' or ':' or '"' or '|' or '?' or '*')
            {
                return true;
            }
        }

        string ext = Path.GetExtension(name).ToLowerInvariant();
        return ext is ".exe" or ".bat" or ".cmd" or ".scr" or ".pif" or ".com"
            or ".php" or ".jsp" or ".asp" or ".js" or ".html" or ".htm";
    }
}

internal sealed class CompletePhotoUploadCommandValidator : AbstractValidator<CompletePhotoUploadCommand>
{
    public CompletePhotoUploadCommandValidator()
    {
        RuleFor(c => c.StorageKey).NotEmpty();
        RuleFor(c => c.FileName).NotEmpty();
    }
}
