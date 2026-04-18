using FluentValidation;

namespace GlobalScout.Application.Billing.CreateCheckoutSession;

internal sealed class CreateCheckoutSessionCommandValidator : AbstractValidator<CreateCheckoutSessionCommand>
{
    public CreateCheckoutSessionCommandValidator()
    {
        RuleFor(c => c.UserId).NotEmpty();
    }
}
