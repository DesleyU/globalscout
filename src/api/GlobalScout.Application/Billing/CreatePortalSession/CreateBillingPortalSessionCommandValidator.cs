using FluentValidation;

namespace GlobalScout.Application.Billing.CreatePortalSession;

internal sealed class CreateBillingPortalSessionCommandValidator : AbstractValidator<CreateBillingPortalSessionCommand>
{
    public CreateBillingPortalSessionCommandValidator()
    {
        RuleFor(c => c.UserId).NotEmpty();
    }
}
