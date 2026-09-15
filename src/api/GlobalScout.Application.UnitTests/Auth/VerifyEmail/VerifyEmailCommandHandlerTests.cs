using GlobalScout.Application.Abstractions.Auth;
using GlobalScout.Application.Auth;
using GlobalScout.Application.Auth.VerifyEmail;
using GlobalScout.SharedKernel;
using Moq;
using Xunit;

namespace GlobalScout.Application.UnitTests.Auth.VerifyEmail;

public sealed class VerifyEmailCommandHandlerTests
{
    [Fact]
    public async Task Handle_returns_newly_verified_when_identity_store_confirms_the_account()
    {
        var identityStore = new Mock<IUserIdentityStore>();
        identityStore.Setup(s => s.VerifyEmailAsync("a-token", It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Success(VerifyEmailOutcome.NewlyVerified));

        var handler = new VerifyEmailCommandHandler(identityStore.Object);
        var result = await handler.Handle(new VerifyEmailCommand("a-token"), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.False(result.Value.AlreadyVerified);
    }

    [Fact]
    public async Task Handle_returns_already_verified_without_treating_it_as_an_error()
    {
        var identityStore = new Mock<IUserIdentityStore>();
        identityStore.Setup(s => s.VerifyEmailAsync("a-token", It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Success(VerifyEmailOutcome.AlreadyVerified));

        var handler = new VerifyEmailCommandHandler(identityStore.Object);
        var result = await handler.Handle(new VerifyEmailCommand("a-token"), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.True(result.Value.AlreadyVerified);
    }

    [Theory]
    [InlineData("expired-token")]
    [InlineData("tampered-token")]
    [InlineData("unknown-token")]
    public async Task Handle_propagates_the_same_generic_error_for_every_invalid_token_shape(string token)
    {
        var identityStore = new Mock<IUserIdentityStore>();
        identityStore.Setup(s => s.VerifyEmailAsync(token, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Failure<VerifyEmailOutcome>(AuthErrors.InvalidOrExpiredVerificationToken));

        var handler = new VerifyEmailCommandHandler(identityStore.Object);
        var result = await handler.Handle(new VerifyEmailCommand(token), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal(AuthErrors.InvalidOrExpiredVerificationToken, result.Error);
    }
}
