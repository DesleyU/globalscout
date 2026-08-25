using System.Text.Json;
using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Application.Statistics;
using Xunit;

namespace GlobalScout.Application.UnitTests.Statistics;

public sealed class PlayerStatisticsDataPayloadTests
{
    [Fact]
    public void ParseManualForMerge_reads_flat_manual_keys()
    {
        using JsonDocument doc = JsonDocument.Parse(
            """{"kind":"manual","season":"2024","goals":3,"assists":1,"matches":10,"minutes":500,"yellowCards":2,"redCards":0,"rating":7.2}""");
        ManualStatisticsValues v = PlayerStatisticsDataPayload.ParseManualForMerge(doc);
        Assert.Equal(3, v.Goals);
        Assert.Equal(1, v.Assists);
        Assert.Equal(10, v.Matches);
        Assert.Equal(500, v.Minutes);
        Assert.Equal(2, v.YellowCards);
        Assert.Equal(0, v.RedCards);
        Assert.Equal(7.2, v.Rating);
    }

    [Fact]
    public void ParseManualForMerge_reads_appearances_alias_as_matches()
    {
        using JsonDocument doc = JsonDocument.Parse("""{"appearances":11}""");
        ManualStatisticsValues v = PlayerStatisticsDataPayload.ParseManualForMerge(doc);
        Assert.Equal(11, v.Matches);
    }

    [Fact]
    public void ParseManualForMerge_reads_nested_aggregated()
    {
        using JsonDocument doc = JsonDocument.Parse(
            """{"aggregated":{"goals":4,"minutes":200,"yellow_cards":1}}""");
        ManualStatisticsValues v = PlayerStatisticsDataPayload.ParseManualForMerge(doc);
        Assert.Equal(4, v.Goals);
        Assert.Equal(200, v.Minutes);
        Assert.Equal(1, v.YellowCards);
    }

    [Fact]
    public void CreateManualDocument_writes_aggregated_and_competitions()
    {
        var teamId = Guid.NewGuid();
        var competitionId = Guid.NewGuid();
        var values = new ManualStatisticsValues
        {
            Goals = 2,
            Assists = 4,
            Matches = 8,
            Minutes = 400,
            YellowCards = 0,
            RedCards = 1,
            Rating = 6.5,
            Competitions =
            [
                new ResolvedManualCompetition
                {
                    TeamCatalogId = teamId,
                    TeamName = "FC Voluntari U19",
                    TeamIsVerified = false,
                    CompetitionCatalogId = competitionId,
                    CompetitionName = "Liga Elitelor",
                    CompetitionCountry = "Romania",
                    Level = "YouthAcademy",
                    CompetitionIsVerified = false,
                    SeasonYear = 2024,
                    Appearances = 8,
                    Minutes = 400,
                    Goals = 2,
                    Assists = 4,
                    YellowCards = 0,
                    RedCards = 1,
                    Rating = 6.5,
                },
            ],
        };

        using JsonDocument doc = PlayerStatisticsDataPayload.CreateManualDocument("2024", values);
        var root = doc.RootElement;

        Assert.True(root.TryGetProperty("aggregated", out var aggregated));
        Assert.Equal(2, aggregated.GetProperty("goals").GetInt32());
        Assert.True(root.TryGetProperty("competitions", out var competitions));
        Assert.Equal(1, competitions.GetArrayLength());
        Assert.Equal(teamId.ToString(), competitions[0].GetProperty("team").GetProperty("catalogId").GetString());
        Assert.Equal(competitionId.ToString(), competitions[0].GetProperty("competition").GetProperty("catalogId").GetString());
    }

    [Fact]
    public void CreateManualDocument_round_trips_merge()
    {
        var values = new ManualStatisticsValues
        {
            Goals = 2,
            Assists = 4,
            Matches = 8,
            Minutes = 400,
            YellowCards = 0,
            RedCards = 1,
            Rating = 6.5,
            ShotsTotal = 9
        };
        using JsonDocument doc = PlayerStatisticsDataPayload.CreateManualDocument("2024", values);
        ManualStatisticsValues roundTrip = PlayerStatisticsDataPayload.ParseManualForMerge(doc);
        Assert.Equal(values.Goals, roundTrip.Goals);
        Assert.Equal(values.ShotsTotal, roundTrip.ShotsTotal);
    }
}
