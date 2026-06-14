using GlobalScout.Application.Media.UploadVideo;
using Xunit;

namespace GlobalScout.Application.UnitTests.Media.UploadVideo;

public sealed class UploadVideoCommandValidatorTests
{
    private readonly UploadVideoCommandValidator _validator = new();

    [Fact]
    public void Validate_null_stream_fails()
    {
        var command = new UploadVideoCommand
        {
            UserId = Guid.NewGuid(),
            FileStream = null,
            FileName = "clip.mp4",
            ContentType = "video/mp4"
        };

        var result = _validator.Validate(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.ErrorMessage == "No video file provided.");
    }

    [Fact]
    public void Validate_empty_stream_fails()
    {
        var command = new UploadVideoCommand
        {
            UserId = Guid.NewGuid(),
            FileStream = new MemoryStream(),
            FileName = "clip.mp4",
            ContentType = "video/mp4"
        };

        var result = _validator.Validate(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.ErrorMessage == "No video file provided.");
    }

    [Fact]
    public void Validate_invalid_extension_fails()
    {
        var command = new UploadVideoCommand
        {
            UserId = Guid.NewGuid(),
            FileStream = new MemoryStream([1, 2, 3]),
            FileName = "clip.exe",
            ContentType = "video/mp4"
        };

        var result = _validator.Validate(command);

        Assert.False(result.IsValid);
        Assert.Contains(
            result.Errors,
            e => e.ErrorMessage == "Invalid file extension. Only .mp4, .mov, and .avi files are allowed.");
    }

    [Fact]
    public void Validate_invalid_content_type_fails()
    {
        var command = new UploadVideoCommand
        {
            UserId = Guid.NewGuid(),
            FileStream = new MemoryStream([1, 2, 3]),
            FileName = "clip.mp4",
            ContentType = "video/webm"
        };

        var result = _validator.Validate(command);

        Assert.False(result.IsValid);
        Assert.Contains(
            result.Errors,
            e => e.ErrorMessage == "Invalid file type. Only MP4, MOV, and AVI videos are allowed!");
    }

    [Fact]
    public void Validate_empty_content_type_with_valid_extension_succeeds()
    {
        var command = new UploadVideoCommand
        {
            UserId = Guid.NewGuid(),
            FileStream = new MemoryStream([1, 2, 3]),
            FileName = "clip.mp4",
            ContentType = ""
        };

        var result = _validator.Validate(command);

        Assert.True(result.IsValid);
    }

    [Fact]
    public void Validate_valid_mp4_and_mime_succeeds()
    {
        var command = new UploadVideoCommand
        {
            UserId = Guid.NewGuid(),
            FileStream = new MemoryStream([1, 2, 3]),
            FileName = "clip.mp4",
            ContentType = "video/mp4"
        };

        var result = _validator.Validate(command);

        Assert.True(result.IsValid);
    }

    [Fact]
    public void Validate_suspicious_filename_fails()
    {
        var command = new UploadVideoCommand
        {
            UserId = Guid.NewGuid(),
            FileStream = new MemoryStream([1, 2, 3]),
            FileName = "..\\clip.mp4",
            ContentType = "video/mp4"
        };

        var result = _validator.Validate(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.ErrorMessage == "Invalid filename detected!");
    }

    [Fact]
    public void Validate_seekable_stream_over_max_bytes_fails()
    {
        using var stream = new OversizedSeekableStream();
        var command = new UploadVideoCommand
        {
            UserId = Guid.NewGuid(),
            FileStream = stream,
            FileName = "clip.mp4",
            ContentType = "video/mp4"
        };

        var result = _validator.Validate(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.ErrorMessage.Contains("File size must not exceed", StringComparison.Ordinal));
    }

    /// <summary>Reports Length above the validator cap without allocating 500 MB.</summary>
    private sealed class OversizedSeekableStream : Stream
    {
        public override bool CanRead => true;

        public override bool CanSeek => true;

        public override bool CanWrite => false;

        public override long Length => 500L * 1024 * 1024 + 1;

        public override long Position { get; set; }

        public override void Flush()
        {
        }

        public override int Read(byte[] buffer, int offset, int count) => 0;

        public override long Seek(long offset, SeekOrigin origin) => 0;

        public override void SetLength(long value) => throw new NotSupportedException();

        public override void Write(byte[] buffer, int offset, int count) => throw new NotSupportedException();
    }
}
