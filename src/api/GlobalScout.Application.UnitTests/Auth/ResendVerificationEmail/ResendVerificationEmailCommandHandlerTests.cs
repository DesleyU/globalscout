using GlobalScout.Application.Abstractions.Auth;
using GlobalScout.Application.Auth;
using GlobalScout.Application.Auth.ResendVerificationEmail;
using GlobalScout.SharedKernel;
using Moq;
using Xunit;

namespace GlobalScout.Application.UnitTests.Auth.ResendVerificationEmail;

public sealed class ResendVerificationEmailCommandHandlerTests
{
    [Fact]
    public async Task Handle_returns_success_when_identity_store_issues_a_new_link()
    {
        var userId = Guid.NewGuid();
        var identityStore = new Mock<IUserIdentityStore>();
        identityStore.Setup(s => s.ResendVerificationEmailAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Success());

        var handler = new ResendVerificationEmailCommandHandler(identityStore.Object);
        var result = await handler.Handle(new ResendVerificationEmailCommand(userId), CancellationToken.None);

        Assert.True(result.IsSuccess);
    }

    [Fact]
    public async Task Handle_propagates_already_verified_failure()
    {
        var userId = Guid.NewGuid();
        var identityStore = new Mock<IUserIdentityStore>();
        identityStore.Setup(s => s.ResendVerificationEmailAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Failure(AuthErrors.EmailAlreadyVerified));

        var handler = new ResendVerificationEmailCommandHandler(identityStore.Object);
        var result = await handler.Handle(new ResendVerificationEmailCommand(userId), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal(AuthErrors.EmailAlreadyVerified, result.Error);
    }

    [Fact]
    public async Task Handle_propagates_cooldown_failure()
    {
        var userId = Guid.NewGuid();
        var identityStore = new Mock<IUserIdentityStore>();
        identityStore.Setup(s => s.ResendVerificationEmailAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Failure(AuthErrors.VerificationEmailCooldown));

        var handler = new ResendVerificationEmailCommandHandler(identityStore.Object);
        var result = await handler.Handle(new ResendVerificationEmailCommand(userId), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal(AuthErrors.VerificationEmailCooldown, result.Error);
    }
}
