using GlobalScout.Application.Abstractions.Messaging;

namespace GlobalScout.Application.ReferenceData.GetCountries;

public sealed record GetFootballCountriesQuery : IQuery<GetFootballCountriesResult>;
