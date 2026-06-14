using GlobalScout.Application.Abstractions.Auth;
using GlobalScout.Application.Abstractions.Billing;
using GlobalScout.Application.Account;
using GlobalScout.Application.Billing;
using GlobalScout.Application.Billing.CreatePortalSession;
using GlobalScout.Domain.Identity;
using GlobalScout.SharedKernel;
using Moq;
using Xunit;

namespace GlobalScout.Application.UnitTests.Billing;

public sealed class CreateBillingPortalSessionCommandHandlerTests
{
    private readonly Mock<IUserIdentityStore> _identity = new();
    private readonly Mock<IBillingPortalService> _portal = new();

    [Fact]
    public async Task Returns_portal_url_when_user_has_stripe_customer_id()
    {
        var userId = Guid.NewGuid();
        _identity.Setup(s => s.GetAccountSummaryAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AccountSummary(userId, "u@example.com", AccountType.Premium, DateTimeOffset.UtcNow));
        _identity.Setup(s => s.GetStripeCustomerIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync("cus_existing");
        _portal.Setup(s => s.CreateCustomerPortalSessionAsync("cus_existing", It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Success(new CreateBillingPortalSessionResult("https://billing.stripe.test/portal")));

        var handler = new CreateBillingPortalSessionCommandHandler(_identity.Object, _portal.Object);
        var result = await handler.Handle(new CreateBillingPortalSessionCommand(userId), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal("https://billing.stripe.test/portal", result.Value.Url);
    }

    [Fact]
    public async Task Returns_user_not_found_when_summary_is_null()
    {
        var userId = Guid.NewGuid();
        _identity.Setup(s => s.GetAccountSummaryAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((AccountSummary?)null);

        var handler = new CreateBillingPortalSessionCommandHandler(_identity.Object, _portal.Object);
        var result = await handler.Handle(new CreateBillingPortalSessionCommand(userId), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal(AccountErrors.UserNotFound, result.Error);
        _portal.Verify(
            s => s.CreateCustomerPortalSessionAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task Returns_no_stripe_customer_when_customer_id_missing()
    {
        var userId = Guid.NewGuid();
        _identity.Setup(s => s.GetAccountSummaryAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AccountSummary(userId, "u@example.com", AccountType.Basic, DateTimeOffset.UtcNow));
        _identity.Setup(s => s.GetStripeCustomerIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((string?)null);

        var handler = new CreateBillingPortalSessionCommandHandler(_identity.Object, _portal.Object);
        var result = await handler.Handle(new CreateBillingPortalSessionCommand(userId), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal(BillingErrors.NoStripeCustomer, result.Error);
        _portal.Verify(
            s => s.CreateCustomerPortalSessionAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task Returns_no_stripe_customer_when_customer_id_is_whitespace()
    {
        var userId = Guid.NewGuid();
        _identity.Setup(s => s.GetAccountSummaryAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AccountSummary(userId, "u@example.com", AccountType.Basic, DateTimeOffset.UtcNow));
        _identity.Setup(s => s.GetStripeCustomerIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync("   ");

        var handler = new CreateBillingPortalSessionCommandHandler(_identity.Object, _portal.Object);
        var result = await handler.Handle(new CreateBillingPortalSessionCommand(userId), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal(BillingErrors.NoStripeCustomer, result.Error);
    }
}
