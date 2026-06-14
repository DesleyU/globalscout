using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.ReferenceData;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.ReferenceData.GetCountries;

internal sealed class GetFootballCountriesQueryHandler(IReferenceDataStore referenceData)
    : IQueryHandler<GetFootballCountriesQuery, GetFootballCountriesResult>
{
    public Task<Result<GetFootballCountriesResult>> Handle(
        GetFootballCountriesQuery query,
        CancellationToken cancellationToken)
    {
        var countries = referenceData.GetCountries();
        return Task.FromResult(Result.Success(new GetFootballCountriesResult(countries)));
    }
}
