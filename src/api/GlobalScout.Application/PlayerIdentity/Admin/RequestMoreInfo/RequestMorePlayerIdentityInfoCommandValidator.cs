using FluentValidation;

namespace GlobalScout.Application.PlayerIdentity.Admin.RequestMoreInfo;

internal sealed class RequestMorePlayerIdentityInfoCommandValidator : AbstractValidator<RequestMorePlayerIdentityInfoCommand>
{
    public RequestMorePlayerIdentityInfoCommandValidator()
    {
        RuleFor(c => c.ClaimId).NotEmpty();
        RuleFor(c => c.Note).NotEmpty().MaximumLength(1000);
    }
}
