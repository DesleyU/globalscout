using GlobalScout.Application.Social.Messages.SendMessage;
using Xunit;

namespace GlobalScout.Application.UnitTests.Social.Messages.SendMessage;

public sealed class SendMessageCommandValidatorTests
{
    private readonly SendMessageCommandValidator _validator = new();

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("\n\t ")]
    public void Validate_empty_or_whitespace_content_fails(string content)
    {
        var command = new SendMessageCommand
        {
            SenderId = Guid.NewGuid(),
            ReceiverId = Guid.NewGuid(),
            Content = content
        };

        var result = _validator.Validate(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(SendMessageCommand.Content));
    }

    [Fact]
    public void Validate_content_over_1000_characters_fails()
    {
        var command = new SendMessageCommand
        {
            SenderId = Guid.NewGuid(),
            ReceiverId = Guid.NewGuid(),
            Content = new string('a', 1001)
        };

        var result = _validator.Validate(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(SendMessageCommand.Content));
    }

    [Fact]
    public void Validate_empty_receiver_id_fails()
    {
        var command = new SendMessageCommand
        {
            SenderId = Guid.NewGuid(),
            ReceiverId = Guid.Empty,
            Content = "hello"
        };

        var result = _validator.Validate(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(SendMessageCommand.ReceiverId));
    }

    [Fact]
    public void Validate_content_of_1000_characters_succeeds()
    {
        var command = new SendMessageCommand
        {
            SenderId = Guid.NewGuid(),
            ReceiverId = Guid.NewGuid(),
            Content = new string('a', 1000)
        };

        var result = _validator.Validate(command);

        Assert.True(result.IsValid);
    }
}
