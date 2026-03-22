using GlobalScout.Domain.Media;
using GlobalScout.Infrastructure.Identity;

namespace GlobalScout.Infrastructure.Data.Entities;

public sealed class MediaItem
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public ApplicationUser User { get; set; } = null!;

    public MediaType Type { get; set; }

    public string Url { get; set; } = string.Empty;

    public string? Filename { get; set; }

    public string? OriginalName { get; set; }

    public string? MimeType { get; set; }

    public int? Size { get; set; }

    public string? Title { get; set; }

    public string? Description { get; set; }

    public string? Tags { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }
}
