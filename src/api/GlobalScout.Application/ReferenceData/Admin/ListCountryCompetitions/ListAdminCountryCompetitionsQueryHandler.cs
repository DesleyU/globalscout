using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.ReferenceData;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.ReferenceData.Admin.ListCountryCompetitions;

internal sealed class ListAdminCountryCompetitionsQueryHandler(IReferenceDataCatalog catalog)
    : IQueryHandler<ListAdminCountryCompetitionsQuery, ListAdminCountryCompetitionsResult>
{
    public async Task<Result<ListAdminCountryCompetitionsResult>> Handle(
        ListAdminCountryCompetitionsQuery query,
        CancellationToken cancellationToken)
    {
        var country = FootballCountries.FindByCode(query.CountryCode);
        if (country is null)
        {
            return Result.Failure<ListAdminCountryCompetitionsResult>(
                ReferenceDataErrors.CountryNotSupported);
        }

        var competitions = await catalog.ListCompetitionsForReviewAsync(
            country.Code,
            cancellationToken);

        return Result.Success(new ListAdminCountryCompetitionsResult(competitions));
    }
}
