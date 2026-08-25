using GlobalScout.Application.Abstractions.ReferenceData;
using GlobalScout.Application.ReferenceData;
using GlobalScout.Application.ReferenceData.Admin.ReviewCompetition;
using GlobalScout.Domain.ReferenceData;
using Moq;
using Xunit;

namespace GlobalScout.Application.UnitTests.ReferenceData;

public sealed class ReviewCompetitionSubmissionCommandHandlerTests
{
  [Fact]
  public async Task Handle_returns_not_found_when_league_missing()
  {
    var catalog = new Mock<IReferenceDataCatalog>();
    catalog
      .Setup(instance => instance.TryGetCompetitionForReviewByIdAsync(
        Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"),
        It.IsAny<CancellationToken>()))
      .ReturnsAsync((AdminFootballCompetitionDto?)null);

    var handler = new ReviewCompetitionSubmissionCommandHandler(catalog.Object);
    var result = await handler.Handle(
      new ReviewCompetitionSubmissionCommand(
        Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"),
        Approve: true,
        Level: CompetitionLevel.Amateur,
        Type: CompetitionType.League),
      CancellationToken.None);

    Assert.True(result.IsFailure);
    Assert.Equal(ReferenceDataErrors.CompetitionNotFound, result.Error);
  }

  [Fact]
  public async Task Handle_returns_conflict_when_league_is_not_pending()
  {
    var competitionId = Guid.NewGuid();
    var catalog = new Mock<IReferenceDataCatalog>();
    catalog
      .Setup(instance => instance.TryGetCompetitionForReviewByIdAsync(
        competitionId,
        It.IsAny<CancellationToken>()))
      .ReturnsAsync(CreateLeague(competitionId, ReferenceDataStatus.Approved));

    var handler = new ReviewCompetitionSubmissionCommandHandler(catalog.Object);
    var result = await handler.Handle(
      new ReviewCompetitionSubmissionCommand(
        competitionId,
        Approve: true,
        Level: CompetitionLevel.Amateur,
        Type: CompetitionType.League),
      CancellationToken.None);

    Assert.True(result.IsFailure);
    Assert.Equal(ReferenceDataErrors.CompetitionNotPendingReview, result.Error);
  }

  [Fact]
  public async Task Handle_returns_validation_error_when_approve_level_missing()
  {
    var competitionId = Guid.NewGuid();
    var catalog = new Mock<IReferenceDataCatalog>();
    catalog
      .Setup(instance => instance.TryGetCompetitionForReviewByIdAsync(
        competitionId,
        It.IsAny<CancellationToken>()))
      .ReturnsAsync(CreateLeague(competitionId, ReferenceDataStatus.Pending));

    var handler = new ReviewCompetitionSubmissionCommandHandler(catalog.Object);
    var result = await handler.Handle(
      new ReviewCompetitionSubmissionCommand(
        competitionId,
        Approve: true,
        Level: CompetitionLevel.Unknown,
        Type: CompetitionType.League),
      CancellationToken.None);

    Assert.True(result.IsFailure);
    Assert.Equal(ReferenceDataErrors.CompetitionLevelRequired, result.Error);
  }

  [Fact]
  public async Task Handle_rejects_pending_league()
  {
    var competitionId = Guid.NewGuid();
    var rejected = CreateLeague(competitionId, ReferenceDataStatus.Rejected);
    var catalog = new Mock<IReferenceDataCatalog>();
    catalog
      .Setup(instance => instance.TryGetCompetitionForReviewByIdAsync(
        competitionId,
        It.IsAny<CancellationToken>()))
      .ReturnsAsync(CreateLeague(competitionId, ReferenceDataStatus.Pending));
    catalog
      .Setup(instance => instance.ReviewCompetitionAsync(
        competitionId,
        ReferenceDataStatus.Rejected,
        null,
        null,
        It.IsAny<CancellationToken>()))
      .ReturnsAsync(rejected);

    var handler = new ReviewCompetitionSubmissionCommandHandler(catalog.Object);
    var result = await handler.Handle(
      new ReviewCompetitionSubmissionCommand(
        competitionId,
        Approve: false,
        Level: null,
        Type: null),
      CancellationToken.None);

    Assert.True(result.IsSuccess);
    Assert.Equal(ReferenceDataStatus.Rejected, result.Value.Status);
  }

  private static AdminFootballCompetitionDto CreateLeague(
    Guid competitionId,
    ReferenceDataStatus status) =>
    new(
      competitionId,
      null,
      "Test League",
      "RO",
      "League",
      null,
      CompetitionLevel.Unknown,
      CompetitionLevel.Amateur,
      CompetitionType.League,
      ReferenceDataSource.UserSubmitted,
      status,
      Guid.NewGuid(),
      DateTimeOffset.UtcNow,
      DateTimeOffset.UtcNow);
}
