using GlobalScout.Application.Users.UploadBanner;
using Xunit;

namespace GlobalScout.Application.UnitTests.Users.UploadBanner;

public sealed class InitiateBannerUploadCommandValidatorTests
{
    private readonly InitiateBannerUploadCommandValidator _validator = new();

    [Fact]
    public void Validate_invalid_extension_fails()
    {
        var command = new InitiateBannerUploadCommand
        {
            UserId = Guid.NewGuid(),
            FileName = "banner.exe",
            ContentType = "image/jpeg",
            ContentLength = 100
        };

        var result = _validator.Validate(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.ErrorMessage == "Banner must be an image file (jpg, png, gif, webp).");
    }

    [Fact]
    public void Validate_valid_jpg_succeeds()
    {
        var command = new InitiateBannerUploadCommand
        {
            UserId = Guid.NewGuid(),
            FileName = "banner.jpg",
            ContentType = "image/jpeg",
            ContentLength = 100
        };

        var result = _validator.Validate(command);

        Assert.True(result.IsValid);
    }

    [Fact]
    public void Validate_oversized_content_length_fails()
    {
        var command = new InitiateBannerUploadCommand
        {
            UserId = Guid.NewGuid(),
            FileName = "banner.jpg",
            ContentType = "image/jpeg",
            ContentLength = 10 * 1024 * 1024 + 1
        };

        var result = _validator.Validate(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.ErrorMessage == "File size must not exceed 10 MB.");
    }

    [Fact]
    public void Validate_zero_content_length_fails()
    {
        var command = new InitiateBannerUploadCommand
        {
            UserId = Guid.NewGuid(),
            FileName = "banner.jpg",
            ContentType = "image/jpeg",
            ContentLength = 0
        };

        var result = _validator.Validate(command);

        Assert.False(result.IsValid);
    }
}
