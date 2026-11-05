using GlobalScout.Application.Media.UploadPhoto;
using Xunit;

namespace GlobalScout.Application.UnitTests.Media.UploadPhoto;

public sealed class CompletePhotoUploadCommandValidatorTests
{
    private readonly CompletePhotoUploadCommandValidator _validator = new();

    [Fact]
    public void Validate_empty_storage_key_fails()
    {
        var command = new CompletePhotoUploadCommand
        {
            UserId = Guid.NewGuid(),
            StorageKey = "",
            FileName = "photo.jpg",
            ContentType = "image/jpeg"
        };

        var result = _validator.Validate(command);

        Assert.False(result.IsValid);
    }

    [Fact]
    public void Validate_empty_filename_fails()
    {
        var command = new CompletePhotoUploadCommand
        {
            UserId = Guid.NewGuid(),
            StorageKey = "media/photos/abc/def.jpg",
            FileName = "",
            ContentType = "image/jpeg"
        };

        var result = _validator.Validate(command);

        Assert.False(result.IsValid);
    }

    [Fact]
    public void Validate_valid_command_succeeds()
    {
        var command = new CompletePhotoUploadCommand
        {
            UserId = Guid.NewGuid(),
            StorageKey = "media/photos/abc/def.jpg",
            FileName = "photo.jpg",
            ContentType = "image/jpeg"
        };

        var result = _validator.Validate(command);

        Assert.True(result.IsValid);
    }
}
