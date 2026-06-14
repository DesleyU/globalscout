using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.ReferenceData;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.ReferenceData.SearchTeams;

internal sealed class SearchFootballTeamsQueryHandler(
    IReferenceDataStore referenceData,
    IExternalTeamSearch externalTeamSearch)
    : IQueryHandler<SearchFootballTeamsQuery, SearchFootballTeamsResult>
{
    private const int MinPreloadedSearchLength = 2;
    private const int MinExternalSearchLength = 3;

    public async Task<Result<SearchFootballTeamsResult>> Handle(
        SearchFootballTeamsQuery query,
        CancellationToken cancellationToken)
    {
        var country = query.Country.Trim();
        var searchTerm = query.SearchTerm.Trim();

        if (searchTerm.Length < MinPreloadedSearchLength)
        {
            return Result.Success(new SearchFootballTeamsResult([]));
        }

        if (referenceData.IsPreloadedCountry(country))
        {
            var preloaded = referenceData.SearchPreloadedTeams(country, searchTerm);
            if (preloaded.Count > 0)
            {
                return Result.Success(new SearchFootballTeamsResult(preloaded));
            }
        }

        if (searchTerm.Length < MinExternalSearchLength)
        {
            return Result.Success(new SearchFootballTeamsResult([]));
        }

        var external = await externalTeamSearch.SearchAsync(country, searchTerm, cancellationToken);
        if (external.IsFailure)
        {
            return Result.Failure<SearchFootballTeamsResult>(external.Error);
        }

        return Result.Success(new SearchFootballTeamsResult(external.Value));
    }
}
