using FluentValidation;

namespace GlobalScout.Application.Statistics.UpsertMyStats;

internal sealed class UpsertMyPlayerStatisticsCommandValidator : AbstractValidator<UpsertMyPlayerStatisticsCommand>
{
    public UpsertMyPlayerStatisticsCommandValidator()
    {
        RuleFor(c => c.Season)
            .NotEmpty()
            .MaximumLength(32);
    }
}
