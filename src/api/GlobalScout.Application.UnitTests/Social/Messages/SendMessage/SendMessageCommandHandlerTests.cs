using GlobalScout.Application.Abstractions.Auth;
using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Application.Abstractions.Social.Messages;
using GlobalScout.Application.Auth;
using GlobalScout.Application.Social.Messages.SendMessage;
using Moq;
using Xunit;

namespace GlobalScout.Application.UnitTests.Social.Messages.SendMessage;

public sealed class SendMessageCommandHandlerTests
{
    [Fact]
    public async Task Handle_blocks_an_unverified_sender_without_creating_a_message()
    {
        var senderId = Guid.NewGuid();
        var receiverId = Guid.NewGuid();

        var identityStore = new Mock<IUserIdentityStore>();
        identityStore.Setup(s => s.IsEmailConfirmedAsync(senderId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var social = new Mock<ISocialGraphRepository>();
        var messages = new Mock<IMessageRepository>();
        var notifier = new Mock<IMessageRealtimeNotifier>();

        var handler = new SendMessageCommandHandler(social.Object, messages.Object, notifier.Object, identityStore.Object);
        var command = new SendMessageCommand
        {
            SenderId = senderId,
            ReceiverId = receiverId,
            Content = "hello",
        };

        var result = await handler.Handle(command, CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal(AuthErrors.EmailNotVerified, result.Error);
        messages.Verify(
            m => m.CreateMessageAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }
}
