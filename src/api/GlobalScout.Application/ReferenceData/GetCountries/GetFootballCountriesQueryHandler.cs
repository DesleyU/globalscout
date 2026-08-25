using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.ReferenceData;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.ReferenceData.GetCountries;

internal sealed class GetFootballCountriesQueryHandler
    : IQueryHandler<GetFootballCountriesQuery, GetFootballCountriesResult>
{
    public Task<Result<GetFootballCountriesResult>> Handle(
        GetFootballCountriesQuery query,
        CancellationToken cancellationToken)
    {
        var countries = FootballCountries.GetAll();
        return Task.FromResult(Result.Success(new GetFootballCountriesResult(countries)));
    }
}
