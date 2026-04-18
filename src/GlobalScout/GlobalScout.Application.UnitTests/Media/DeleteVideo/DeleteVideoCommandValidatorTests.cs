using GlobalScout.Application.Media.DeleteVideo;
using Xunit;

namespace GlobalScout.Application.UnitTests.Media.DeleteVideo;

public sealed class DeleteVideoCommandValidatorTests
{
    private readonly DeleteVideoCommandValidator _validator = new();

    [Fact]
    public void Validate_empty_video_id_fails()
    {
        var command = new DeleteVideoCommand { UserId = Guid.NewGuid(), VideoId = Guid.Empty };

        var result = _validator.Validate(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(DeleteVideoCommand.VideoId));
    }

    [Fact]
    public void Validate_valid_ids_succeeds()
    {
        var command = new DeleteVideoCommand
        {
            UserId = Guid.NewGuid(),
            VideoId = Guid.NewGuid()
        };

        var result = _validator.Validate(command);

        Assert.True(result.IsValid);
    }
}
