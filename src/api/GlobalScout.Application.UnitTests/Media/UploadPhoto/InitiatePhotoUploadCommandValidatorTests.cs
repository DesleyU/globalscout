using GlobalScout.Application.Media.UploadPhoto;
using Xunit;

namespace GlobalScout.Application.UnitTests.Media.UploadPhoto;

public sealed class InitiatePhotoUploadCommandValidatorTests
{
    private readonly InitiatePhotoUploadCommandValidator _validator = new();

    [Fact]
    public void Validate_empty_filename_fails()
    {
        var command = new InitiatePhotoUploadCommand
        {
            UserId = Guid.NewGuid(),
            FileName = "",
            ContentType = "image/jpeg",
            ContentLength = 100
        };

        var result = _validator.Validate(command);

        Assert.False(result.IsValid);
    }

    [Fact]
    public void Validate_invalid_extension_fails()
    {
        var command = new InitiatePhotoUploadCommand
        {
            UserId = Guid.NewGuid(),
            FileName = "photo.exe",
            ContentType = "image/jpeg",
            ContentLength = 100
        };

        var result = _validator.Validate(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.ErrorMessage == "Photo must be a JPG, PNG, or WebP image.");
    }

    [Fact]
    public void Validate_gif_extension_fails()
    {
        var command = new InitiatePhotoUploadCommand
        {
            UserId = Guid.NewGuid(),
            FileName = "photo.gif",
            ContentType = "image/gif",
            ContentLength = 100
        };

        var result = _validator.Validate(command);

        Assert.False(result.IsValid);
    }

    [Fact]
    public void Validate_invalid_content_type_fails()
    {
        var command = new InitiatePhotoUploadCommand
        {
            UserId = Guid.NewGuid(),
            FileName = "photo.jpg",
            ContentType = "image/bmp",
            ContentLength = 100
        };

        var result = _validator.Validate(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.ErrorMessage == "Photo must be a JPG, PNG, or WebP image.");
    }

    [Fact]
    public void Validate_empty_content_type_with_valid_extension_succeeds()
    {
        var command = new InitiatePhotoUploadCommand
        {
            UserId = Guid.NewGuid(),
            FileName = "photo.jpg",
            ContentType = "",
            ContentLength = 100
        };

        var result = _validator.Validate(command);

        Assert.True(result.IsValid);
    }

    [Fact]
    public void Validate_valid_jpg_and_mime_succeeds()
    {
        var command = new InitiatePhotoUploadCommand
        {
            UserId = Guid.NewGuid(),
            FileName = "photo.jpg",
            ContentType = "image/jpeg",
            ContentLength = 100
        };

        var result = _validator.Validate(command);

        Assert.True(result.IsValid);
    }

    [Fact]
    public void Validate_suspicious_filename_fails()
    {
        var command = new InitiatePhotoUploadCommand
        {
            UserId = Guid.NewGuid(),
            FileName = "..\\photo.jpg",
            ContentType = "image/jpeg",
            ContentLength = 100
        };

        var result = _validator.Validate(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.ErrorMessage == "Invalid filename detected!");
    }

    [Fact]
    public void Validate_zero_content_length_fails()
    {
        var command = new InitiatePhotoUploadCommand
        {
            UserId = Guid.NewGuid(),
            FileName = "photo.jpg",
            ContentType = "image/jpeg",
            ContentLength = 0
        };

        var result = _validator.Validate(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.ErrorMessage == "No photo file provided.");
    }

    [Fact]
    public void Validate_oversized_content_length_fails()
    {
        var command = new InitiatePhotoUploadCommand
        {
            UserId = Guid.NewGuid(),
            FileName = "photo.jpg",
            ContentType = "image/jpeg",
            ContentLength = 15L * 1024 * 1024 + 1
        };

        var result = _validator.Validate(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.ErrorMessage.Contains("File size must not exceed", StringComparison.Ordinal));
    }
}
