using FluentValidation;

namespace GlobalScout.Application.Media.UploadVideo;

internal sealed class UploadVideoCommandValidator : AbstractValidator<UploadVideoCommand>
{
    private static readonly string[] AllowedExtensions = [".mp4", ".mov", ".avi"];

    private static readonly HashSet<string> AllowedContentTypes =
    [
        "video/mp4",
        "video/mov",
        "video/avi",
        "video/quicktime",
        "video/x-msvideo"
    ];

    public UploadVideoCommandValidator()
    {
        RuleFor(c => c.FileStream)
            .NotNull()
            .WithMessage("No video file provided.");

        RuleFor(c => c.FileName)
            .NotEmpty();

        RuleFor(c => c)
            .Must(c => c.FileStream is null || c.FileStream.Length > 0)
            .WithMessage("No video file provided.");

        RuleFor(c => c.FileName)
            .Must(name =>
            {
                var ext = Path.GetExtension(name).ToLowerInvariant();
                return AllowedExtensions.Contains(ext);
            })
            .WithMessage("Invalid file extension. Only .mp4, .mov, and .avi files are allowed.");

        RuleFor(c => c)
            .Must(c =>
            {
                if (string.IsNullOrWhiteSpace(c.ContentType))
                {
                    return true;
                }

                return AllowedContentTypes.Contains(c.ContentType.ToLowerInvariant());
            })
            .WithMessage("Invalid file type. Only MP4, MOV, and AVI videos are allowed!");

        RuleFor(c => c.FileName)
            .Must(name => !HasSuspiciousFileName(name))
            .WithMessage("Invalid filename detected!");

        RuleFor(c => c.FileStream)
            .Must(s => s is null || !s.CanSeek || s.Length <= VideoStorageOptionsForValidation.MaxVideoBytes)
            .When(c => c.FileStream is not null)
            .WithMessage(_ => $"File size must not exceed {VideoStorageOptionsForValidation.MaxVideoBytes / (1024 * 1024)} MB.");
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
        if (ext is ".exe" or ".bat" or ".cmd" or ".scr" or ".pif" or ".com"
            or ".php" or ".jsp" or ".asp" or ".js" or ".html" or ".htm")
        {
            return true;
        }

        return false;
    }

    /// <summary>Default cap matches <see cref="VideoStorageOptions.MaxVideoBytes"/> when not overridden in config.</summary>
    private static class VideoStorageOptionsForValidation
    {
        public const long MaxVideoBytes = 500L * 1024 * 1024;
    }
}
