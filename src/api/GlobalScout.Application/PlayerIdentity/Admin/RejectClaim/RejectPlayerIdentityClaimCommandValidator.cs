using FluentValidation;

namespace GlobalScout.Application.PlayerIdentity.Admin.RejectClaim;

internal sealed class RejectPlayerIdentityClaimCommandValidator : AbstractValidator<RejectPlayerIdentityClaimCommand>
{
    public RejectPlayerIdentityClaimCommandValidator()
    {
        RuleFor(c => c.ClaimId).NotEmpty();
        RuleFor(c => c.Note).NotEmpty().MaximumLength(1000);
    }
}
