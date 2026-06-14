namespace GlobalScout.Application.Abstractions.Files;

public sealed class AvatarStorageOptions
{
    public const string SectionName = "AvatarStorage";

    /// <summary>
    /// Absolute directory where avatar files are written.
    /// Leave empty to use &lt;WebRoot&gt;/uploads/avatars (see API host registration).
    /// </summary>
    public string PhysicalAvatarsDirectory { get; set; } = string.Empty;

    /// <summary>URL path prefix returned after upload (must match static file mapping).</summary>
    public string PublicRequestPath { get; set; } = "/uploads/avatars";
}
