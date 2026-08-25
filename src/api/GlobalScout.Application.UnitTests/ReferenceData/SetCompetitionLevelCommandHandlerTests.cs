using GlobalScout.Application.Abstractions.ReferenceData;
using GlobalScout.Application.ReferenceData;
using GlobalScout.Application.ReferenceData.Admin.SetCompetitionLevel;
using GlobalScout.Domain.ReferenceData;
using Moq;
using Xunit;

namespace GlobalScout.Application.UnitTests.ReferenceData;

public sealed class SetCompetitionLevelCommandHandlerTests
{
  [Fact]
  public async Task Handle_returns_not_found_when_league_missing()
  {
    var catalog = new Mock<IReferenceDataCatalog>();
    catalog
      .Setup(instance => instance.SetCompetitionLevelAsync(
        Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"),
        CompetitionLevel.Amateur,
        It.IsAny<CancellationToken>()))
      .ReturnsAsync((AdminFootballCompetitionDto?)null);

    var handler = new SetCompetitionLevelCommandHandler(catalog.Object);
    var result = await handler.Handle(
      new SetCompetitionLevelCommand(
        Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"),
        CompetitionLevel.Amateur),
      CancellationToken.None);

    Assert.True(result.IsFailure);
    Assert.Equal(ReferenceDataErrors.CompetitionNotFound, result.Error);
  }

  [Fact]
  public async Task Handle_updates_level_when_league_exists()
  {
    var competitionId = Guid.NewGuid();
    var updated = new AdminFootballCompetitionDto(
      competitionId,
      42,
      "Liga I",
      "RO",
      "League",
      null,
      CompetitionLevel.ProfessionalTier1,
      null,
      null,
      ReferenceDataSource.Provider,
      ReferenceDataStatus.Approved,
      null,
      DateTimeOffset.UtcNow,
      DateTimeOffset.UtcNow);

    var catalog = new Mock<IReferenceDataCatalog>();
    catalog
      .Setup(instance => instance.SetCompetitionLevelAsync(
        competitionId,
        CompetitionLevel.ProfessionalTier1,
        It.IsAny<CancellationToken>()))
      .ReturnsAsync(updated);

    var handler = new SetCompetitionLevelCommandHandler(catalog.Object);
    var result = await handler.Handle(
      new SetCompetitionLevelCommand(competitionId, CompetitionLevel.ProfessionalTier1),
      CancellationToken.None);

    Assert.True(result.IsSuccess);
    Assert.Equal(CompetitionLevel.ProfessionalTier1, result.Value.Level);
  }
}
