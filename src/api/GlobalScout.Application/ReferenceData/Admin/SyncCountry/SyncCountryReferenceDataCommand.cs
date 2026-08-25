using GlobalScout.Application.Abstractions.Messaging;

namespace GlobalScout.Application.ReferenceData.Admin.SyncCountry;

public sealed record SyncCountryReferenceDataCommand(
    string CountryCode,
    Guid AdminUserId) : ICommand<SyncCountryReferenceDataResult>;

public sealed record SyncCountryReferenceDataResult(
    string CountryCode,
    string CountryName,
    ReferenceDataSyncCounts Competitions,
    ReferenceDataSyncCounts Teams,
    DateTimeOffset SyncedAt);

public sealed record ReferenceDataSyncCounts(
    int Fetched,
    int Added,
    int Updated);
