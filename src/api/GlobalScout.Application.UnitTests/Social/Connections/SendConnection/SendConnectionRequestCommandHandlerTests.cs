using GlobalScout.Application.Abstractions.Auth;
using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Application.Auth;
using GlobalScout.Application.Social.Connections.SendConnection;
using Moq;
using Xunit;

namespace GlobalScout.Application.UnitTests.Social.Connections.SendConnection;

public sealed class SendConnectionRequestCommandHandlerTests
{
    [Fact]
    public async Task Handle_blocks_an_unverified_sender_without_creating_a_connection()
    {
        var senderId = Guid.NewGuid();
        var receiverId = Guid.NewGuid();

        var identityStore = new Mock<IUserIdentityStore>();
        identityStore.Setup(s => s.IsEmailConfirmedAsync(senderId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var social = new Mock<ISocialGraphRepository>();

        var handler = new SendConnectionRequestCommandHandler(social.Object, identityStore.Object);
        var command = new SendConnectionRequestCommand
        {
            SenderId = senderId,
            ReceiverId = receiverId,
        };

        var result = await handler.Handle(command, CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal(AuthErrors.EmailNotVerified, result.Error);
        social.Verify(
            s => s.CreateConnectionAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
        social.Verify(s => s.IsActiveUserAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()), Times.Never);
    }
}
