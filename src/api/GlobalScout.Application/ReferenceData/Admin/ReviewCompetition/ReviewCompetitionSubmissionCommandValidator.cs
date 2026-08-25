using FluentValidation;
using GlobalScout.Domain.ReferenceData;

namespace GlobalScout.Application.ReferenceData.Admin.ReviewCompetition;

internal sealed class ReviewCompetitionSubmissionCommandValidator
    : AbstractValidator<ReviewCompetitionSubmissionCommand>
{
    public ReviewCompetitionSubmissionCommandValidator()
    {
        RuleFor(command => command.CompetitionId).NotEmpty();

        When(command => command.Approve, () =>
        {
            RuleFor(command => command.Level)
                .NotNull()
                .IsInEnum()
                .NotEqual(CompetitionLevel.Unknown)
                .WithMessage("A competition level is required before approval.");
            RuleFor(command => command.Type)
                .NotNull()
                .IsInEnum()
                .WithMessage("A competition type is required before approval.");
        });
    }
}
