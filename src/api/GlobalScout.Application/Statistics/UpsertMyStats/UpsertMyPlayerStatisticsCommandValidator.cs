using FluentValidation;
using GlobalScout.Application.Abstractions.Persistence;

namespace GlobalScout.Application.Statistics.UpsertMyStats;

internal sealed class UpsertMyPlayerStatisticsCommandValidator : AbstractValidator<UpsertMyPlayerStatisticsCommand>
{
    public UpsertMyPlayerStatisticsCommandValidator()
    {
        RuleFor(c => c.Season)
            .NotEmpty()
            .MaximumLength(32)
            .Must(IsValidSeasonYear)
            .WithMessage("Season must be a four-digit year.");

        RuleFor(c => c.Competitions)
            .NotEmpty()
            .WithMessage("At least one competition entry is required.");

        RuleForEach(c => c.Competitions).ChildRules(competition =>
        {
            competition.RuleFor(c => c.TeamCatalogId).NotEmpty();
            competition.RuleFor(c => c.CompetitionCatalogId).NotEmpty();
            competition.RuleFor(c => c.Appearances).GreaterThanOrEqualTo(0);
            competition.RuleFor(c => c.Minutes).GreaterThanOrEqualTo(0);
            competition.RuleFor(c => c.Goals).GreaterThanOrEqualTo(0);
            competition.RuleFor(c => c.Assists).GreaterThanOrEqualTo(0);
            competition.RuleFor(c => c.YellowCards).GreaterThanOrEqualTo(0);
            competition.RuleFor(c => c.RedCards).GreaterThanOrEqualTo(0);
            competition.RuleFor(c => c.Rating)
                .InclusiveBetween(0, 10)
                .When(c => c.Rating.HasValue);
            competition.RuleFor(c => c)
                .Must(c => c.Minutes <= c.Appearances * 120)
                .WithMessage("Minutes cannot exceed appearances × 120.");
        });

        RuleFor(c => c.PassesAccuracy)
            .InclusiveBetween(0, 100)
            .When(c => c.PassesAccuracy.HasValue);
    }

    private static bool IsValidSeasonYear(string season) =>
        season.Length == 4
        && int.TryParse(season, out var year)
        && year is >= 1950 and <= 2100;
}
