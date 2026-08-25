using FluentValidation;
using GlobalScout.Domain.ReferenceData;

namespace GlobalScout.Application.ReferenceData.SubmitCompetition;

internal sealed class SubmitFootballCompetitionCommandValidator
    : AbstractValidator<SubmitFootballCompetitionCommand>
{
    public SubmitFootballCompetitionCommandValidator()
    {
        RuleFor(command => command.UserId).NotEmpty();
        RuleFor(command => command.Country)
            .NotEmpty()
            .MaximumLength(80);
        RuleFor(command => command.Name)
            .NotEmpty()
            .MinimumLength(2)
            .MaximumLength(200);
        RuleFor(command => command.LevelHint)
            .IsInEnum()
            .NotEqual(CompetitionLevel.Unknown)
            .WithMessage("A competition level hint is required.");
        RuleFor(command => command.TypeHint)
            .IsInEnum()
            .WithMessage("A competition type hint is required.");
    }
}
