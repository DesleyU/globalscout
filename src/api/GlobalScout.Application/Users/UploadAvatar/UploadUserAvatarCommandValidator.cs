using FluentValidation;

namespace GlobalScout.Application.Users.UploadAvatar;

internal sealed class UploadUserAvatarCommandValidator : AbstractValidator<UploadUserAvatarCommand>
{
    private static readonly string[] AllowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

    public UploadUserAvatarCommandValidator()
    {
        RuleFor(c => c.FileStream)
            .NotNull()
            .WithMessage("No file uploaded.");

        RuleFor(c => c.FileName)
            .NotEmpty();

        RuleFor(c => c)
            .Must(c => c.FileStream is null || c.FileStream.Length > 0)
            .WithMessage("No file uploaded.");

        RuleFor(c => c.FileName)
            .Must(name =>
            {
                var ext = Path.GetExtension(name).ToLowerInvariant();
                return AllowedExtensions.Contains(ext);
            })
            .WithMessage("Avatar must be an image file (jpg, png, gif, webp).");

        RuleFor(c => c.FileStream)
            .Must(s => s is null || s.Length <= 5 * 1024 * 1024)
            .When(c => c.FileStream is not null)
            .WithMessage("File size must not exceed 5 MB.");
    }
}

internal sealed class InitiateAvatarUploadCommandValidator : AbstractValidator<InitiateAvatarUploadCommand>
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

    public InitiateAvatarUploadCommandValidator()
    {
        RuleFor(c => c.FileName).NotEmpty();

        RuleFor(c => c.FileName)
            .Must(name => AllowedExtensions.Contains(Path.GetExtension(name).ToLowerInvariant()))
            .WithMessage("Avatar must be an image file (jpg, png, gif, webp).");

        RuleFor(c => c.ContentType)
            .Must(type => string.IsNullOrWhiteSpace(type) || AllowedContentTypes.Contains(type.ToLowerInvariant()))
            .WithMessage("Avatar must be an image file (jpg, png, gif, webp).");

        RuleFor(c => c.ContentLength)
            .GreaterThan(0)
            .WithMessage("No file uploaded.")
            .LessThanOrEqualTo(5 * 1024 * 1024)
            .WithMessage("File size must not exceed 5 MB.");
    }
}

internal sealed class CompleteAvatarUploadCommandValidator : AbstractValidator<CompleteAvatarUploadCommand>
{
    public CompleteAvatarUploadCommandValidator()
    {
        RuleFor(c => c.StorageKey).NotEmpty();
    }
}
