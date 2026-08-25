using FluentValidation;
using GlobalScout.Domain.ReferenceData;

namespace GlobalScout.Application.ReferenceData.Admin.SetCompetitionType;

internal sealed class SetCompetitionTypeCommandValidator : AbstractValidator<SetCompetitionTypeCommand>
{
    public SetCompetitionTypeCommandValidator()
    {
        RuleFor(command => command.CompetitionId).NotEmpty();
        RuleFor(command => command.Type).IsInEnum();
    }
}
