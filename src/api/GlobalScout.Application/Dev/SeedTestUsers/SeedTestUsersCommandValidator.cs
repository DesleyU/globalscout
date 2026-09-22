using FluentValidation;
using GlobalScout.Domain.Identity;

namespace GlobalScout.Application.Dev.SeedTestUsers;

internal sealed class SeedTestUsersCommandValidator : AbstractValidator<SeedTestUsersCommand>
{
    private static readonly string[] AllowedRoles = [AppRoleNames.Player, AppRoleNames.Club, AppRoleNames.ScoutAgent];

    public SeedTestUsersCommandValidator()
    {
        RuleFor(x => x.Role)
            .NotEmpty()
            .Must(role => AllowedRoles.Contains(role, StringComparer.Ordinal))
            .WithMessage($"Role must be one of: {string.Join(", ", AllowedRoles)}.");

        RuleFor(x => x.Count)
            .InclusiveBetween(1, 25);
    }
}
