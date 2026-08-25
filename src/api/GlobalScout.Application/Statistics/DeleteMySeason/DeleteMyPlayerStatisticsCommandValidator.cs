using FluentValidation;

namespace GlobalScout.Application.Statistics.DeleteMySeason;

internal sealed class DeleteMyPlayerStatisticsCommandValidator : AbstractValidator<DeleteMyPlayerStatisticsCommand>
{
    public DeleteMyPlayerStatisticsCommandValidator()
    {
        RuleFor(c => c.Season)
            .NotEmpty()
            .MaximumLength(32);
    }
}
