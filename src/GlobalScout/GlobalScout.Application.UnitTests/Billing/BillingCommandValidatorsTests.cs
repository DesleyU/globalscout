using GlobalScout.Application.Billing.CreateCheckoutSession;
using GlobalScout.Application.Billing.CreatePortalSession;
using Xunit;

namespace GlobalScout.Application.UnitTests.Billing;

public sealed class BillingCommandValidatorsTests
{
    [Fact]
    public void CreateCheckoutSession_rejects_empty_user_id()
    {
        var validator = new CreateCheckoutSessionCommandValidator();

        var result = validator.Validate(new CreateCheckoutSessionCommand(Guid.Empty));

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateCheckoutSessionCommand.UserId));
    }

    [Fact]
    public void CreateCheckoutSession_accepts_non_empty_user_id()
    {
        var validator = new CreateCheckoutSessionCommandValidator();

        var result = validator.Validate(new CreateCheckoutSessionCommand(Guid.NewGuid()));

        Assert.True(result.IsValid);
    }

    [Fact]
    public void CreateBillingPortalSession_rejects_empty_user_id()
    {
        var validator = new CreateBillingPortalSessionCommandValidator();

        var result = validator.Validate(new CreateBillingPortalSessionCommand(Guid.Empty));

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateBillingPortalSessionCommand.UserId));
    }

    [Fact]
    public void CreateBillingPortalSession_accepts_non_empty_user_id()
    {
        var validator = new CreateBillingPortalSessionCommandValidator();

        var result = validator.Validate(new CreateBillingPortalSessionCommand(Guid.NewGuid()));

        Assert.True(result.IsValid);
    }
}
