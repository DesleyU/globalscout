using FluentValidation;

namespace GlobalScout.Application.ReferenceData.SearchTeams;

internal sealed class SearchFootballTeamsQueryValidator : AbstractValidator<SearchFootballTeamsQuery>
{
    public SearchFootballTeamsQueryValidator()
    {
        RuleFor(q => q.Country)
            .NotEmpty()
            .MaximumLength(80);

        RuleFor(q => q.SearchTerm)
            .NotEmpty()
            .MaximumLength(120);
    }
}
