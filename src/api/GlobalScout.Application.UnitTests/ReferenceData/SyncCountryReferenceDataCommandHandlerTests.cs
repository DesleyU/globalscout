using GlobalScout.Application.Abstractions.ReferenceData;
using GlobalScout.Application.ReferenceData;
using GlobalScout.Application.ReferenceData.Admin.SyncCountry;
using GlobalScout.Domain.ReferenceData;
using GlobalScout.SharedKernel;
using Moq;
using Xunit;

namespace GlobalScout.Application.UnitTests.ReferenceData;

public sealed class SyncCountryReferenceDataCommandHandlerTests
{
    [Fact]
    public async Task Handle_upserts_provider_rows_and_records_country_sync_state()
    {
        var adminUserId = Guid.NewGuid();
        var externalTeams = new ExternalFootballTeam(101, "Sync FC", "SFC", 1990, false, null);
        var externalLeagues = new ExternalFootballCompetition(202, "Sync League", "League", null);
        var provider = new Mock<IExternalCountryReferenceDataProvider>();
        provider
            .Setup(instance => instance.GetTeamsAsync(
                "Romania",
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Success<IReadOnlyList<ExternalFootballTeam>>([externalTeams]));
        provider
            .Setup(instance => instance.GetLeaguesAsync(
                "Romania",
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Success<IReadOnlyList<ExternalFootballCompetition>>([externalLeagues]));

        var catalog = new Mock<IReferenceDataCatalog>();
        catalog
            .Setup(instance => instance.UpsertProviderTeamsAsync(
                "RO",
                It.Is<IReadOnlyList<ExternalFootballTeam>>(teams => teams.Count == 1),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ProviderUpsertResult<FootballTeamDto>(
                [new FootballTeamDto(
                    Guid.NewGuid(),
                    externalTeams.ExternalTeamId,
                    externalTeams.Name,
                    externalTeams.Code,
                    "Romania",
                    externalTeams.Founded,
                    externalTeams.National,
                    externalTeams.LogoUrl,
                    true)],
                1,
                0));
        catalog
            .Setup(instance => instance.UpsertProviderCompetitionsAsync(
                "RO",
                It.Is<IReadOnlyList<ExternalFootballCompetition>>(items => items.Count == 1),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ProviderUpsertResult<FootballCompetitionDto>(
                [new FootballCompetitionDto(
                    Guid.NewGuid(),
                    externalLeagues.ExternalCompetitionId,
                    externalLeagues.Name,
                    "Romania",
                    externalLeagues.Type,
                    externalLeagues.LogoUrl,
                    CompetitionLevel.Unknown,
                    true)],
                1,
                0));
        catalog
            .Setup(instance => instance.RecordCountrySyncAsync(
                "RO",
                1,
                1,
                adminUserId,
                It.IsAny<DateTimeOffset>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var handler = new SyncCountryReferenceDataCommandHandler(
            provider.Object,
            catalog.Object);

        var result = await handler.Handle(
            new SyncCountryReferenceDataCommand("RO", adminUserId),
            CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal("RO", result.Value.CountryCode);
        Assert.Equal("Romania", result.Value.CountryName);
        Assert.Equal(1, result.Value.Teams.Fetched);
        Assert.Equal(1, result.Value.Teams.Added);
        Assert.Equal(0, result.Value.Teams.Updated);
        Assert.Equal(1, result.Value.Competitions.Fetched);
        Assert.Equal(1, result.Value.Competitions.Added);
        catalog.VerifyAll();
        provider.VerifyAll();
    }

    [Fact]
    public async Task Handle_rejects_an_unknown_country_code()
    {
        var provider = new Mock<IExternalCountryReferenceDataProvider>();
        var catalog = new Mock<IReferenceDataCatalog>();
        var handler = new SyncCountryReferenceDataCommandHandler(
            provider.Object,
            catalog.Object);

        var result = await handler.Handle(
            new SyncCountryReferenceDataCommand("ZZ", Guid.NewGuid()),
            CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal(ReferenceDataErrors.CountryNotSupported, result.Error);
        provider.VerifyNoOtherCalls();
        catalog.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Handle_returns_failure_when_provider_team_fetch_fails()
    {
        var provider = new Mock<IExternalCountryReferenceDataProvider>();
        provider
            .Setup(instance => instance.GetTeamsAsync(
                "Romania",
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Failure<IReadOnlyList<ExternalFootballTeam>>(
                ReferenceDataErrors.ExternalCountrySyncUnavailable));
        provider
            .Setup(instance => instance.GetLeaguesAsync(
                "Romania",
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Success<IReadOnlyList<ExternalFootballCompetition>>([]));

        var catalog = new Mock<IReferenceDataCatalog>();
        var handler = new SyncCountryReferenceDataCommandHandler(
            provider.Object,
            catalog.Object);

        var result = await handler.Handle(
            new SyncCountryReferenceDataCommand("RO", Guid.NewGuid()),
            CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal(ReferenceDataErrors.ExternalCountrySyncUnavailable, result.Error);
        catalog.VerifyNoOtherCalls();
    }
}
