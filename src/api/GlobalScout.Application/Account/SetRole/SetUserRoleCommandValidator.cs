using FluentValidation;
using GlobalScout.Domain.Identity;

namespace GlobalScout.Application.Account.SetRole;

internal sealed class SetUserRoleCommandValidator : AbstractValidator<SetUserRoleCommand>
{
    public SetUserRoleCommandValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty();

        RuleFor(x => x.NewRole)
            .NotEmpty()
            .Must(IsAllowedTargetRole)
            .WithMessage("Invalid role for account type selection.");
    }

    private static bool IsAllowedTargetRole(string? role)
    {
        if (string.IsNullOrWhiteSpace(role))
        {
            return false;
        }

        var normalized = role.Trim().ToUpperInvariant();
        return normalized is AppRoleNames.Player or AppRoleNames.Club or AppRoleNames.ScoutAgent;
    }
}
