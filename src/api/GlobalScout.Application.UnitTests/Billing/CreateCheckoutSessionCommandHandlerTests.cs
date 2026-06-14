using GlobalScout.Application.Abstractions.Auth;
using GlobalScout.Application.Abstractions.Billing;
using GlobalScout.Application.Account;
using GlobalScout.Application.Billing;
using GlobalScout.Application.Billing.CreateCheckoutSession;
using GlobalScout.Domain.Identity;
using GlobalScout.SharedKernel;
using Moq;
using Xunit;

namespace GlobalScout.Application.UnitTests.Billing;

public sealed class CreateCheckoutSessionCommandHandlerTests
{
    private readonly Mock<IUserIdentityStore> _identity = new();
    private readonly Mock<IBillingCheckoutService> _checkout = new();

    [Fact]
    public async Task Returns_checkout_url_when_user_is_basic()
    {
        var userId = Guid.NewGuid();
        _identity.Setup(s => s.GetAccountSummaryAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AccountSummary(userId, "u@example.com", AccountType.Basic, DateTimeOffset.UtcNow));
        _checkout.Setup(s => s.CreatePremiumSubscriptionCheckoutAsync(userId, "u@example.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Success(new CreateCheckoutSessionResult("sess_1", "https://checkout.stripe.test/collect")));

        var handler = new CreateCheckoutSessionCommandHandler(_identity.Object, _checkout.Object);
        var result = await handler.Handle(new CreateCheckoutSessionCommand(userId), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal("https://checkout.stripe.test/collect", result.Value.Url);
    }

    [Fact]
    public async Task Returns_failure_when_already_premium()
    {
        var userId = Guid.NewGuid();
        _identity.Setup(s => s.GetAccountSummaryAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AccountSummary(userId, "u@example.com", AccountType.Premium, DateTimeOffset.UtcNow));

        var handler = new CreateCheckoutSessionCommandHandler(_identity.Object, _checkout.Object);
        var result = await handler.Handle(new CreateCheckoutSessionCommand(userId), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal(BillingErrors.AlreadyPremium, result.Error);
        _checkout.Verify(
            s => s.CreatePremiumSubscriptionCheckoutAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task Returns_user_not_found_when_summary_is_null()
    {
        var userId = Guid.NewGuid();
        _identity.Setup(s => s.GetAccountSummaryAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((AccountSummary?)null);

        var handler = new CreateCheckoutSessionCommandHandler(_identity.Object, _checkout.Object);
        var result = await handler.Handle(new CreateCheckoutSessionCommand(userId), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal(AccountErrors.UserNotFound, result.Error);
        _checkout.Verify(
            s => s.CreatePremiumSubscriptionCheckoutAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task Propagates_checkout_service_failure()
    {
        var userId = Guid.NewGuid();
        _identity.Setup(s => s.GetAccountSummaryAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AccountSummary(userId, "u@example.com", AccountType.Basic, DateTimeOffset.UtcNow));
        _checkout.Setup(s => s.CreatePremiumSubscriptionCheckoutAsync(userId, "u@example.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Failure<CreateCheckoutSessionResult>(BillingErrors.CheckoutSessionFailed));

        var handler = new CreateCheckoutSessionCommandHandler(_identity.Object, _checkout.Object);
        var result = await handler.Handle(new CreateCheckoutSessionCommand(userId), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal(BillingErrors.CheckoutSessionFailed, result.Error);
    }
}
