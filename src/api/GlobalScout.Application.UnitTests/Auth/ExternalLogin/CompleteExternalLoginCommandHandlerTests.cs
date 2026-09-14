using GlobalScout.Application.Abstractions.Auth;
using GlobalScout.Application.Auth.ExternalLogin;
using GlobalScout.SharedKernel;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Xunit;

namespace GlobalScout.Application.UnitTests.Auth.ExternalLogin;

public sealed class CompleteExternalLoginCommandHandlerTests
{
    private static ExternalLoginInfoDto Info(
        string? email = "external@example.com",
        bool emailVerified = true,
        int? age = null,
        DateOnly? dateOfBirth = null,
        string providerKey = "provider-key-1") =>
        new("Google", providerKey, email, emailVerified, "Pedri", "Gonzalez", age, dateOfBirth);

    private static CompleteExternalLoginCommandHandler CreateHandler(
        Mock<IExternalLoginAccessor> loginAccessor,
        Mock<IExternalIdentityStore> identityStore) =>
        new(loginAccessor.Object, identityStore.Object, NullLogger<CompleteExternalLoginCommandHandler>.Instance);

    [Fact]
    public async Task Handle_returns_provider_error_when_no_external_login_info_available()
    {
        var loginAccessor = new Mock<IExternalLoginAccessor>();
        loginAccessor.Setup(a => a.GetExternalLoginInfoAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync((ExternalLoginInfoDto?)null);
        var identityStore = new Mock<IExternalIdentityStore>();

        var handler = CreateHandler(loginAccessor, identityStore);
        var result = await handler.Handle(new CompleteExternalLoginCommand("Google"), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal(ExternalLoginErrors.ProviderError, result.Error);
    }

    [Fact]
    public async Task Handle_creates_a_new_account_when_nothing_matches()
    {
        var info = Info();
        var newUserId = Guid.NewGuid();

        var loginAccessor = new Mock<IExternalLoginAccessor>();
        loginAccessor.Setup(a => a.GetExternalLoginInfoAsync(It.IsAny<CancellationToken>())).ReturnsAsync(info);

        var identityStore = new Mock<IExternalIdentityStore>();
        identityStore.Setup(s => s.FindUserIdByLoginAsync(info.Provider, info.ProviderKey, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Guid?)null);
        identityStore.Setup(s => s.FindUserIdByEmailAsync(info.Email!, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Guid?)null);
        identityStore.Setup(s => s.CreateUserWithLoginAsync(info, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Success(newUserId));

        var handler = CreateHandler(loginAccessor, identityStore);
        var result = await handler.Handle(new CompleteExternalLoginCommand("Google"), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(newUserId, result.Value.UserId);
        Assert.True(result.Value.IsNewAccount);
        identityStore.Verify(s => s.LinkLoginAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Theory]
    [InlineData(12)]
    [InlineData(15)]
    public async Task Handle_blocks_new_account_creation_when_provider_reports_under_16_age(int age)
    {
        var info = Info(age: age);

        var loginAccessor = new Mock<IExternalLoginAccessor>();
        loginAccessor.Setup(a => a.GetExternalLoginInfoAsync(It.IsAny<CancellationToken>())).ReturnsAsync(info);

        var identityStore = new Mock<IExternalIdentityStore>();
        identityStore.Setup(s => s.FindUserIdByLoginAsync(info.Provider, info.ProviderKey, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Guid?)null);
        identityStore.Setup(s => s.FindUserIdByEmailAsync(info.Email!, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Guid?)null);

        var handler = CreateHandler(loginAccessor, identityStore);
        var result = await handler.Handle(new CompleteExternalLoginCommand("Google"), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal(ExternalLoginErrors.UnderAge, result.Error);
        identityStore.Verify(
            s => s.CreateUserWithLoginAsync(It.IsAny<ExternalLoginInfoDto>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task Handle_blocks_new_account_creation_when_provider_reports_under_16_date_of_birth()
    {
        var dob = DateOnly.FromDateTime(DateTime.UtcNow.AddYears(-10));
        var info = Info(dateOfBirth: dob);

        var loginAccessor = new Mock<IExternalLoginAccessor>();
        loginAccessor.Setup(a => a.GetExternalLoginInfoAsync(It.IsAny<CancellationToken>())).ReturnsAsync(info);

        var identityStore = new Mock<IExternalIdentityStore>();
        identityStore.Setup(s => s.FindUserIdByLoginAsync(info.Provider, info.ProviderKey, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Guid?)null);
        identityStore.Setup(s => s.FindUserIdByEmailAsync(info.Email!, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Guid?)null);

        var handler = CreateHandler(loginAccessor, identityStore);
        var result = await handler.Handle(new CompleteExternalLoginCommand("Google"), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal(ExternalLoginErrors.UnderAge, result.Error);
    }

    [Fact]
    public async Task Handle_signs_in_existing_linked_user_without_re_checking_age_or_email()
    {
        var info = Info(age: 10); // even an implausible/under-16 age must not block a returning user.
        var existingUserId = Guid.NewGuid();

        var loginAccessor = new Mock<IExternalLoginAccessor>();
        loginAccessor.Setup(a => a.GetExternalLoginInfoAsync(It.IsAny<CancellationToken>())).ReturnsAsync(info);

        var identityStore = new Mock<IExternalIdentityStore>();
        identityStore.Setup(s => s.FindUserIdByLoginAsync(info.Provider, info.ProviderKey, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingUserId);

        var handler = CreateHandler(loginAccessor, identityStore);
        var result = await handler.Handle(new CompleteExternalLoginCommand("Google"), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(existingUserId, result.Value.UserId);
        Assert.False(result.Value.IsNewAccount);
        identityStore.Verify(s => s.FindUserIdByEmailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
        identityStore.Verify(s => s.CreateUserWithLoginAsync(It.IsAny<ExternalLoginInfoDto>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_auto_links_when_email_is_provider_verified_and_matches_an_existing_account()
    {
        var info = Info(emailVerified: true);
        var existingUserId = Guid.NewGuid();

        var loginAccessor = new Mock<IExternalLoginAccessor>();
        loginAccessor.Setup(a => a.GetExternalLoginInfoAsync(It.IsAny<CancellationToken>())).ReturnsAsync(info);

        var identityStore = new Mock<IExternalIdentityStore>();
        identityStore.Setup(s => s.FindUserIdByLoginAsync(info.Provider, info.ProviderKey, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Guid?)null);
        identityStore.Setup(s => s.FindUserIdByEmailAsync(info.Email!, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingUserId);
        identityStore.Setup(s => s.LinkLoginAsync(existingUserId, info.Provider, info.ProviderKey, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Success());

        var handler = CreateHandler(loginAccessor, identityStore);
        var result = await handler.Handle(new CompleteExternalLoginCommand("Google"), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(existingUserId, result.Value.UserId);
        Assert.False(result.Value.IsNewAccount);
        identityStore.Verify(
            s => s.CreateUserWithLoginAsync(It.IsAny<ExternalLoginInfoDto>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task Handle_rejects_unverified_email_matching_an_existing_account_without_linking()
    {
        var info = Info(emailVerified: false);
        var existingUserId = Guid.NewGuid();

        var loginAccessor = new Mock<IExternalLoginAccessor>();
        loginAccessor.Setup(a => a.GetExternalLoginInfoAsync(It.IsAny<CancellationToken>())).ReturnsAsync(info);

        var identityStore = new Mock<IExternalIdentityStore>();
        identityStore.Setup(s => s.FindUserIdByLoginAsync(info.Provider, info.ProviderKey, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Guid?)null);
        identityStore.Setup(s => s.FindUserIdByEmailAsync(info.Email!, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingUserId);

        var handler = CreateHandler(loginAccessor, identityStore);
        var result = await handler.Handle(new CompleteExternalLoginCommand("Google"), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal(ExternalLoginErrors.EmailInUse, result.Error);
        identityStore.Verify(
            s => s.LinkLoginAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }
}
