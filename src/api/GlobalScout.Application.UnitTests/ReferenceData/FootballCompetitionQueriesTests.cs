using GlobalScout.Application.Abstractions.ReferenceData;
using GlobalScout.Application.ReferenceData.ListCompetitions;
using GlobalScout.Application.ReferenceData.SearchCompetitions;
using GlobalScout.Domain.ReferenceData;
using Moq;
using Xunit;

namespace GlobalScout.Application.UnitTests.ReferenceData;

public sealed class FootballCompetitionQueriesTests
{
    [Fact]
    public async Task List_resolves_display_country_name_and_forwards_level()
    {
        var competition = CreateCompetition("Liga IV", CompetitionLevel.Amateur);
        var catalog = new Mock<IReferenceDataCatalog>();
        catalog
            .Setup(instance => instance.ListCompetitionsAsync(
                "RO",
                CompetitionLevel.Amateur,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([competition]);
        var handler = new ListFootballCompetitionsQueryHandler(catalog.Object);

        var result = await handler.Handle(
            new ListFootballCompetitionsQuery("Romania", CompetitionLevel.Amateur),
            CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(competition, Assert.Single(result.Value.Competitions));
    }

    [Fact]
    public async Task Search_returns_empty_below_minimum_length_without_querying_catalog()
    {
        var catalog = new Mock<IReferenceDataCatalog>();
        var handler = new SearchFootballCompetitionsQueryHandler(catalog.Object);

        var result = await handler.Handle(
            new SearchFootballCompetitionsQuery("Romania", "l", null),
            CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Empty(result.Value.Competitions);
        catalog.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Search_accepts_country_code_and_limits_results()
    {
        var competition = CreateCompetition("Liga II", CompetitionLevel.ProfessionalTier2);
        var catalog = new Mock<IReferenceDataCatalog>();
        catalog
            .Setup(instance => instance.SearchCompetitionsAsync(
                "RO",
                "liga",
                CompetitionLevel.ProfessionalTier2,
                25,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([competition]);
        var handler = new SearchFootballCompetitionsQueryHandler(catalog.Object);

        var result = await handler.Handle(
            new SearchFootballCompetitionsQuery(
                "ro",
                "liga",
                CompetitionLevel.ProfessionalTier2),
            CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(competition, Assert.Single(result.Value.Competitions));
    }

    private static FootballCompetitionDto CreateCompetition(string name, CompetitionLevel level) =>
        new(Guid.NewGuid(), null, name, "Romania", "League", null, level, false);
}
