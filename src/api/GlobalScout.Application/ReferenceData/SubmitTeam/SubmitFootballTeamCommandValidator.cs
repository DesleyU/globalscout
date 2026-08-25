using FluentValidation;

namespace GlobalScout.Application.ReferenceData.SubmitTeam;

internal sealed class SubmitFootballTeamCommandValidator
    : AbstractValidator<SubmitFootballTeamCommand>
{
    public SubmitFootballTeamCommandValidator()
    {
        RuleFor(command => command.UserId).NotEmpty();
        RuleFor(command => command.Country)
            .NotEmpty()
            .MaximumLength(80);
        RuleFor(command => command.Name)
            .NotEmpty()
            .MinimumLength(2)
            .MaximumLength(200);
    }
}
