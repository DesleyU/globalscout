namespace GlobalScout.Application.Abstractions.Files;

public sealed class VideoStorageOptions
{
    public const string SectionName = "VideoStorage";

    /// <summary>
    /// Absolute directory where video files are written.
    /// Leave empty to use &lt;WebRoot&gt;/uploads/videos (see API host registration).
    /// </summary>
    public string PhysicalVideosDirectory { get; set; } = string.Empty;

    /// <summary>URL path prefix returned after upload (must match static file mapping).</summary>
    public string PublicRequestPath { get; set; } = "/uploads/videos";

    /// <summary>Maximum upload size in bytes (default 500 MB, legacy).</summary>
    public long MaxVideoBytes { get; set; } = 500L * 1024 * 1024;
}
