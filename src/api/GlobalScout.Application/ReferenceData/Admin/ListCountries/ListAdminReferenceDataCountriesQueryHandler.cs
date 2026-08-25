using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.ReferenceData;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.ReferenceData.Admin.ListCountries;

internal sealed class ListAdminReferenceDataCountriesQueryHandler(IReferenceDataCatalog catalog)
    : IQueryHandler<ListAdminReferenceDataCountriesQuery, ListAdminReferenceDataCountriesResult>
{
    public async Task<Result<ListAdminReferenceDataCountriesResult>> Handle(
        ListAdminReferenceDataCountriesQuery query,
        CancellationToken cancellationToken)
    {
        var countries = await catalog.ListCountrySummariesAsync(cancellationToken);
        return Result.Success(new ListAdminReferenceDataCountriesResult(countries));
    }
}
