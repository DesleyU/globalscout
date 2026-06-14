using FluentValidation;
using GlobalScout.Application.Auth;

namespace GlobalScout.Application.PlayerIdentity.CreateClaim;

internal sealed class CreatePlayerIdentityClaimCommandValidator : AbstractValidator<CreatePlayerIdentityClaimCommand>
{
    public CreatePlayerIdentityClaimCommandValidator()
    {
        RuleFor(c => c.ExternalPlayerId).GreaterThan(0);

        RuleFor(c => c.FirstName)
            .NotEmpty()
            .MaximumLength(80);

        RuleFor(c => c.LastName)
            .NotEmpty()
            .MinimumLength(2)
            .MaximumLength(80);

        RuleFor(c => c.DateOfBirth)
            .Must(dob => dob <= DateOnly.FromDateTime(DateTime.UtcNow))
            .WithMessage("Date of birth cannot be in the future.");

        RuleFor(c => c.Nationality)
            .NotEmpty()
            .MaximumLength(80);

        RuleFor(c => c.CurrentCountry)
            .NotEmpty()
            .MaximumLength(80);

        RuleFor(c => c.CurrentTeamId)
            .GreaterThan(0);

        RuleFor(c => c.CurrentClub)
            .NotEmpty()
            .MaximumLength(120);

        RuleFor(c => c.Position)
            .NotEmpty()
            .Must(position => AuthPositionParser.TryParse(position, out _))
            .WithMessage("Invalid position.");

        RuleFor(c => c.PreviousClub)
            .MaximumLength(120)
            .When(c => !string.IsNullOrWhiteSpace(c.PreviousClub));

        RuleFor(c => c.League)
            .MaximumLength(120)
            .When(c => !string.IsNullOrWhiteSpace(c.League));
    }
}
