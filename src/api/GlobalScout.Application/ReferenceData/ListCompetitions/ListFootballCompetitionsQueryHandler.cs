using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.ReferenceData;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.ReferenceData.ListCompetitions;

internal sealed class ListFootballCompetitionsQueryHandler(IReferenceDataCatalog catalog)
    : IQueryHandler<ListFootballCompetitionsQuery, ListFootballCompetitionsResult>
{
    public async Task<Result<ListFootballCompetitionsResult>> Handle(
        ListFootballCompetitionsQuery query,
        CancellationToken cancellationToken)
    {
        var country = FootballCountries.FindByName(query.Country)
                      ?? FootballCountries.FindByCode(query.Country);
        if (country is null)
        {
            return Result.Failure<ListFootballCompetitionsResult>(
                ReferenceDataErrors.CountryNotSupported);
        }

        var competitions = await catalog.ListCompetitionsAsync(
            country.Code,
            query.Level,
            cancellationToken);

        return Result.Success(new ListFootballCompetitionsResult(competitions));
    }
}
