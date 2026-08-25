using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.ReferenceData;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.ReferenceData.SearchCompetitions;

internal sealed class SearchFootballCompetitionsQueryHandler(IReferenceDataCatalog catalog)
    : IQueryHandler<SearchFootballCompetitionsQuery, SearchFootballCompetitionsResult>
{
    private const int MaxResults = 25;
    private const int MinSearchLength = 2;

    public async Task<Result<SearchFootballCompetitionsResult>> Handle(
        SearchFootballCompetitionsQuery query,
        CancellationToken cancellationToken)
    {
        var searchTerm = query.SearchTerm?.Trim() ?? string.Empty;
        if (searchTerm.Length < MinSearchLength)
        {
            return Result.Success(new SearchFootballCompetitionsResult([]));
        }

        var country = FootballCountries.FindByName(query.Country)
                      ?? FootballCountries.FindByCode(query.Country);
        if (country is null)
        {
            return Result.Failure<SearchFootballCompetitionsResult>(
                ReferenceDataErrors.CountryNotSupported);
        }

        var competitions = await catalog.SearchCompetitionsAsync(
            country.Code,
            searchTerm,
            query.Level,
            MaxResults,
            cancellationToken);

        return Result.Success(new SearchFootballCompetitionsResult(competitions));
    }
}
