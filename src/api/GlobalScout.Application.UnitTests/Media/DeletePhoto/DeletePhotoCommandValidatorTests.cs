using GlobalScout.Application.Media.DeletePhoto;
using Xunit;

namespace GlobalScout.Application.UnitTests.Media.DeletePhoto;

public sealed class DeletePhotoCommandValidatorTests
{
    private readonly DeletePhotoCommandValidator _validator = new();

    [Fact]
    public void Validate_empty_photo_id_fails()
    {
        var command = new DeletePhotoCommand { UserId = Guid.NewGuid(), PhotoId = Guid.Empty };

        var result = _validator.Validate(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(DeletePhotoCommand.PhotoId));
    }

    [Fact]
    public void Validate_valid_ids_succeeds()
    {
        var command = new DeletePhotoCommand
        {
            UserId = Guid.NewGuid(),
            PhotoId = Guid.NewGuid()
        };

        var result = _validator.Validate(command);

        Assert.True(result.IsValid);
    }
}
