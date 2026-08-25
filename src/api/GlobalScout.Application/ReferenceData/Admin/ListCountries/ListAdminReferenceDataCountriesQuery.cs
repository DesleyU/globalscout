using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.ReferenceData;

namespace GlobalScout.Application.ReferenceData.Admin.ListCountries;

public sealed record ListAdminReferenceDataCountriesQuery : IQuery<ListAdminReferenceDataCountriesResult>;

public sealed record ListAdminReferenceDataCountriesResult(
    IReadOnlyList<AdminReferenceDataCountryDto> Countries);
