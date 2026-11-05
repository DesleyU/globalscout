using GlobalScout.Application.Users.UploadBanner;
using Xunit;

namespace GlobalScout.Application.UnitTests.Users.UploadBanner;

public sealed class CompleteBannerUploadCommandValidatorTests
{
    private readonly CompleteBannerUploadCommandValidator _validator = new();

    [Fact]
    public void Validate_empty_storage_key_fails()
    {
        var command = new CompleteBannerUploadCommand { UserId = Guid.NewGuid(), StorageKey = "" };

        var result = _validator.Validate(command);

        Assert.False(result.IsValid);
    }

    [Fact]
    public void Validate_valid_storage_key_succeeds()
    {
        var command = new CompleteBannerUploadCommand
        {
            UserId = Guid.NewGuid(),
            StorageKey = "banners/abc/def.jpg"
        };

        var result = _validator.Validate(command);

        Assert.True(result.IsValid);
    }
}
