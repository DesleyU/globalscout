using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.ReferenceData;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.ReferenceData.SearchTeams;

internal sealed class SearchFootballTeamsQueryHandler(
    IReferenceDataCatalog catalog,
    IExternalTeamSearch externalTeamSearch)
    : IQueryHandler<SearchFootballTeamsQuery, SearchFootballTeamsResult>
{
    private const int MaxResults = 25;
    private const int MinLocalSearchLength = 2;
    private const int MinExternalSearchLength = 3;

    public async Task<Result<SearchFootballTeamsResult>> Handle(
        SearchFootballTeamsQuery query,
        CancellationToken cancellationToken)
    {
        var country = query.Country.Trim();
        var searchTerm = query.SearchTerm.Trim();

        if (searchTerm.Length < MinLocalSearchLength)
        {
            return Result.Success(new SearchFootballTeamsResult([]));
        }

        var countryDefinition = FootballCountries.FindByName(country)
                                ?? FootballCountries.FindByCode(country);
        if (countryDefinition is null)
        {
            return Result.Failure<SearchFootballTeamsResult>(
                ReferenceDataErrors.CountryNotSupported);
        }

        var local = await catalog.SearchTeamsAsync(
            countryDefinition.Code,
            searchTerm,
            query.RequiresExternalId,
            MaxResults,
            cancellationToken);
        if (local.Count > 0)
        {
            return Result.Success(new SearchFootballTeamsResult(local));
        }

        if (searchTerm.Length < MinExternalSearchLength)
        {
            return Result.Success(new SearchFootballTeamsResult([]));
        }

        var external = await externalTeamSearch.SearchAsync(
            countryDefinition.ProviderName,
            searchTerm,
            cancellationToken);
        if (external.IsFailure)
        {
            return Result.Failure<SearchFootballTeamsResult>(external.Error);
        }

        var upserted = await catalog.UpsertProviderTeamsAsync(
            countryDefinition.Code,
            external.Value,
            cancellationToken);

        return Result.Success(new SearchFootballTeamsResult(upserted.Items));
    }
}
