using FluentValidation;
using GlobalScout.Domain.Identity;

namespace GlobalScout.Application.Auth.Register;

internal sealed class RegisterUserCommandValidator : AbstractValidator<RegisterUserCommand>
{
    public RegisterUserCommandValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty()
            .EmailAddress();

        RuleFor(x => x.Password)
            .NotEmpty()
            .MinimumLength(6);

        RuleFor(x => x.Role)
            .NotEmpty();

        RuleFor(x => x.Role)
            .Must(r => IsAllowedRegistrationRole(r))
            .WithMessage("Invalid role for registration.");

        RuleFor(x => x.FirstName)
            .NotEmpty()
            .MinimumLength(2)
            .MaximumLength(50);

        RuleFor(x => x.LastName)
            .NotEmpty()
            .MinimumLength(2)
            .MaximumLength(50);

        When(
            x => string.Equals(x.Role?.Trim(), AppRoleNames.Player, StringComparison.OrdinalIgnoreCase),
            () =>
            {
                RuleFor(x => x.Position)
                    .NotEmpty()
                    .Must(BeValidPosition)
                    .WithMessage("Invalid position.");

                RuleFor(x => x.Age)
                    .NotNull()
                    .InclusiveBetween(16, 50);
            });

        When(
            x => string.Equals(x.Role?.Trim(), AppRoleNames.Club, StringComparison.OrdinalIgnoreCase),
            () =>
            {
                RuleFor(x => x.ClubName)
                    .NotEmpty()
                    .MinimumLength(2)
                    .MaximumLength(100);
            });
    }

    private static bool IsAllowedRegistrationRole(string? role)
    {
        if (string.IsNullOrWhiteSpace(role))
        {
            return false;
        }

        var n = role.Trim().ToUpperInvariant();
        return n != AppRoleNames.Admin && AppRoleNames.All.Contains(n);
    }

    private static bool BeValidPosition(string? position)
    {
        if (string.IsNullOrWhiteSpace(position))
        {
            return false;
        }

        return AuthPositionParser.TryParse(position, out _);
    }
}
