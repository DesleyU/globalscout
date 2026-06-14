using FluentValidation;

namespace GlobalScout.Application.PlayerIdentity.Admin.ApproveClaim;

internal sealed class ApprovePlayerIdentityClaimCommandValidator : AbstractValidator<ApprovePlayerIdentityClaimCommand>
{
    public ApprovePlayerIdentityClaimCommandValidator()
    {
        RuleFor(c => c.ClaimId).NotEmpty();
        RuleFor(c => c.Note).MaximumLength(1000).When(c => !string.IsNullOrWhiteSpace(c.Note));
    }
}
