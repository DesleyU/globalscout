using GlobalScout.Domain.Media;

namespace GlobalScout.Domain.Users;

public sealed class MediaItem
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

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
