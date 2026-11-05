using FluentValidation;

namespace GlobalScout.Application.Users.UploadBanner;

internal sealed class InitiateBannerUploadCommandValidator : AbstractValidator<InitiateBannerUploadCommand>
{
    private static readonly string[] AllowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

    private static readonly HashSet<string> AllowedContentTypes =
    [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp"
    ];

    public InitiateBannerUploadCommandValidator()
    {
        RuleFor(c => c.FileName).NotEmpty();

        RuleFor(c => c.FileName)
            .Must(name => AllowedExtensions.Contains(Path.GetExtension(name).ToLowerInvariant()))
            .WithMessage("Banner must be an image file (jpg, png, gif, webp).");

        RuleFor(c => c.ContentType)
            .Must(type => string.IsNullOrWhiteSpace(type) || AllowedContentTypes.Contains(type.ToLowerInvariant()))
            .WithMessage("Banner must be an image file (jpg, png, gif, webp).");

        RuleFor(c => c.ContentLength)
            .GreaterThan(0)
            .WithMessage("No file uploaded.")
            .LessThanOrEqualTo(10 * 1024 * 1024)
            .WithMessage("File size must not exceed 10 MB.");
    }
}

internal sealed class CompleteBannerUploadCommandValidator : AbstractValidator<CompleteBannerUploadCommand>
{
    public CompleteBannerUploadCommandValidator()
    {
        RuleFor(c => c.StorageKey).NotEmpty();
    }
}
