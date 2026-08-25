using FluentValidation;

namespace GlobalScout.Application.ReferenceData.Admin.SetCompetitionLevel;

internal sealed class SetCompetitionLevelCommandValidator : AbstractValidator<SetCompetitionLevelCommand>
{
    public SetCompetitionLevelCommandValidator()
    {
        RuleFor(command => command.CompetitionId).NotEmpty();
        RuleFor(command => command.Level).IsInEnum();
    }
}
