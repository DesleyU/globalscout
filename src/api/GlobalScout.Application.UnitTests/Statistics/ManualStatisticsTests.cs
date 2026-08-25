using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Application.Abstractions.ReferenceData;
using GlobalScout.Application.Statistics;
using GlobalScout.Application.Statistics.UpsertMyStats;
using GlobalScout.Domain.Identity;
using GlobalScout.Domain.ReferenceData;
using GlobalScout.Domain.Users;
using GlobalScout.SharedKernel;
using Moq;
using Xunit;

namespace GlobalScout.Application.UnitTests.Statistics;

public sealed class ManualStatisticsAggregatorTests
{
    [Fact]
    public void Aggregate_sums_competitions_and_weights_rating()
    {
        var competitions = new[]
        {
            new ResolvedManualCompetition
            {
                Appearances = 10,
                Minutes = 800,
                Goals = 3,
                Assists = 1,
                YellowCards = 1,
                RedCards = 0,
                Rating = 7.0,
            },
            new ResolvedManualCompetition
            {
                Appearances = 5,
                Minutes = 300,
                Goals = 2,
                Assists = 2,
                YellowCards = 0,
                RedCards = 1,
                Rating = 8.0,
            },
        };

        var aggregated = ManualStatisticsAggregator.Aggregate(competitions);

        Assert.Equal(5, aggregated.Goals);
        Assert.Equal(3, aggregated.Assists);
        Assert.Equal(15, aggregated.Matches);
        Assert.Equal(1100, aggregated.Minutes);
        Assert.Equal(1, aggregated.YellowCards);
        Assert.Equal(1, aggregated.RedCards);
        Assert.InRange(aggregated.Rating!.Value, 7.32, 7.34);
    }
}

public sealed class UpsertMyPlayerStatisticsCommandHandlerTests
{
    private readonly Mock<IPlayerStatisticsRepository> _stats = new();
    private readonly Mock<IReferenceDataCatalog> _catalog = new();

    [Fact]
    public async Task Handle_rejects_season_covered_by_provider()
    {
        var userId = Guid.NewGuid();
        _stats.Setup(s => s.GetAccountTypeAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(AccountType.Basic);
        _stats.Setup(s => s.ListByUserAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new PlayerStatistics
                {
                    Season = "2024",
                    Source = StatsSource.ApiFootball,
                },
            ]);

        var handler = new UpsertMyPlayerStatisticsCommandHandler(_stats.Object, _catalog.Object);
        var result = await handler.Handle(
            new UpsertMyPlayerStatisticsCommand
            {
                UserId = userId,
                Season = "2024",
                Competitions =
                [
                    new ManualCompetitionInput
                    {
                        TeamCatalogId = Guid.NewGuid(),
                        CompetitionCatalogId = Guid.NewGuid(),
                        Appearances = 1,
                    },
                ],
            },
            CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal(StatsErrors.SeasonCoveredByProvider.Code, result.Error.Code);
    }

    [Fact]
    public async Task Handle_resolves_catalog_and_upserts_manual_row()
    {
        var userId = Guid.NewGuid();
        var teamId = Guid.NewGuid();
        var competitionId = Guid.NewGuid();

        _stats.Setup(s => s.GetAccountTypeAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(AccountType.Basic);
        _stats.Setup(s => s.ListByUserAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        _catalog.Setup(c => c.GetTeamsByIdsAsync(It.IsAny<IReadOnlyCollection<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<Guid, FootballTeamDto>
            {
                [teamId] = new FootballTeamDto(
                    teamId,
                    123,
                    "FC Voluntari U19",
                    null,
                    "Romania",
                    null,
                    false,
                    null,
                    true),
            });

        _catalog.Setup(c => c.GetCompetitionsByIdsAsync(It.IsAny<IReadOnlyCollection<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<Guid, FootballCompetitionDto>
            {
                [competitionId] = new FootballCompetitionDto(
                    competitionId,
                    456,
                    "Liga Elitelor",
                    "Romania",
                    "League",
                    null,
                    CompetitionLevel.YouthAcademy,
                    false),
            });

        _stats.Setup(s => s.UpsertManualAndReturnAsync(
                userId,
                "2024",
                It.IsAny<ManualStatisticsValues>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PlayerStatistics
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Season = "2024",
                Source = StatsSource.Manual,
                SchemaVersion = PlayerStatisticsDataPayload.ManualSchemaVersion,
                UpdatedAt = DateTimeOffset.UtcNow,
            });

        var handler = new UpsertMyPlayerStatisticsCommandHandler(_stats.Object, _catalog.Object);
        var result = await handler.Handle(
            new UpsertMyPlayerStatisticsCommand
            {
                UserId = userId,
                Season = "2024",
                Competitions =
                [
                    new ManualCompetitionInput
                    {
                        TeamCatalogId = teamId,
                        CompetitionCatalogId = competitionId,
                        Appearances = 10,
                        Minutes = 800,
                        Goals = 4,
                        Assists = 2,
                    },
                ],
            },
            CancellationToken.None);

        Assert.True(result.IsSuccess);
        _stats.Verify(
            s => s.UpsertManualAndReturnAsync(
                userId,
                "2024",
                It.Is<ManualStatisticsValues>(v =>
                    v.Goals == 4
                    && v.Matches == 10
                    && v.Competitions.Count == 1
                    && v.Competitions[0].TeamName == "FC Voluntari U19"),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
