using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.ReferenceData;

namespace GlobalScout.Application.ReferenceData.Admin.ListCountryCompetitions;

public sealed record ListAdminCountryCompetitionsQuery(string CountryCode)
    : IQuery<ListAdminCountryCompetitionsResult>;

public sealed record ListAdminCountryCompetitionsResult(
    IReadOnlyList<AdminFootballCompetitionDto> Competitions);
