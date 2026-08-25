using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.ReferenceData;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.ReferenceData.Admin.SyncCountry;

internal sealed class SyncCountryReferenceDataCommandHandler(
    IExternalCountryReferenceDataProvider provider,
    IReferenceDataCatalog catalog)
    : ICommandHandler<SyncCountryReferenceDataCommand, SyncCountryReferenceDataResult>
{
    public async Task<Result<SyncCountryReferenceDataResult>> Handle(
        SyncCountryReferenceDataCommand command,
        CancellationToken cancellationToken)
    {
        var country = FootballCountries.FindByCode(command.CountryCode);
        if (country is null)
        {
            return Result.Failure<SyncCountryReferenceDataResult>(
                ReferenceDataErrors.CountryNotSupported);
        }

        var teamsTask = provider.GetTeamsAsync(country.ProviderName, cancellationToken);
        var competitionsTask = provider.GetLeaguesAsync(country.ProviderName, cancellationToken);
        await Task.WhenAll(teamsTask, competitionsTask);

        var teamsResult = await teamsTask;
        if (teamsResult.IsFailure)
        {
            return Result.Failure<SyncCountryReferenceDataResult>(teamsResult.Error);
        }

        var competitionsResult = await competitionsTask;
        if (competitionsResult.IsFailure)
        {
            return Result.Failure<SyncCountryReferenceDataResult>(competitionsResult.Error);
        }

        var teamsUpsert = await catalog.UpsertProviderTeamsAsync(
            country.Code,
            teamsResult.Value,
            cancellationToken);
        var competitionsUpsert = await catalog.UpsertProviderCompetitionsAsync(
            country.Code,
            competitionsResult.Value,
            cancellationToken);
        var syncedAt = DateTimeOffset.UtcNow;

        await catalog.RecordCountrySyncAsync(
            country.Code,
            competitionsUpsert.Items.Count,
            teamsUpsert.Items.Count,
            command.AdminUserId,
            syncedAt,
            cancellationToken);

        return Result.Success(new SyncCountryReferenceDataResult(
            country.Code,
            country.Name,
            new ReferenceDataSyncCounts(
                competitionsResult.Value.Count,
                competitionsUpsert.AddedCount,
                competitionsUpsert.UpdatedCount),
            new ReferenceDataSyncCounts(
                teamsResult.Value.Count,
                teamsUpsert.AddedCount,
                teamsUpsert.UpdatedCount),
            syncedAt));
    }
}
