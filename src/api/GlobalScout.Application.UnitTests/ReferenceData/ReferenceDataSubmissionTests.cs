using GlobalScout.Application.Abstractions.ReferenceData;
using GlobalScout.Application.ReferenceData;
using GlobalScout.Application.ReferenceData.SubmitCompetition;
using GlobalScout.Application.ReferenceData.SubmitTeam;
using GlobalScout.Domain.ReferenceData;
using Moq;
using Xunit;

namespace GlobalScout.Application.UnitTests.ReferenceData;

public sealed class ReferenceDataSubmissionTests
{
    [Fact]
    public async Task SubmitTeam_uses_country_code_and_combined_limit()
    {
        var userId = Guid.NewGuid();
        var submitted = new FootballTeamDto(
            Guid.NewGuid(),
            null,
            "Local FC",
            null,
            "Romania",
            null,
            false,
            null,
            false);
        var catalog = new Mock<IReferenceDataCatalog>();
        catalog
            .Setup(instance => instance.TrySubmitTeamAsync(
                "RO",
                "Local FC",
                userId,
                5,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(submitted);
        var handler = new SubmitFootballTeamCommandHandler(catalog.Object);

        var result = await handler.Handle(
            new SubmitFootballTeamCommand(userId, "Romania", "Local FC"),
            CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(submitted, result.Value);
    }

    [Fact]
    public async Task SubmitCompetition_returns_conflict_when_pending_limit_is_reached()
    {
        var catalog = new Mock<IReferenceDataCatalog>();
        catalog
            .Setup(instance => instance.TrySubmitCompetitionAsync(
                "RO",
                "Liga Locală",
                CompetitionLevel.Amateur,
                CompetitionType.League,
                It.IsAny<Guid>(),
                5,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((FootballCompetitionDto?)null);
        var handler = new SubmitFootballCompetitionCommandHandler(catalog.Object);

        var result = await handler.Handle(
            new SubmitFootballCompetitionCommand(
                Guid.NewGuid(),
                "RO",
                "Liga Locală",
                CompetitionLevel.Amateur,
                CompetitionType.League),
            CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal(ReferenceDataErrors.TooManyPendingSubmissions, result.Error);
    }

    [Fact]
    public async Task SubmitCompetition_returns_submitted_row_with_unknown_level()
    {
        var submitted = new FootballCompetitionDto(
            Guid.NewGuid(),
            null,
            "Liga Locală",
            "Romania",
            null,
            null,
            CompetitionLevel.Unknown,
            false);
        var catalog = new Mock<IReferenceDataCatalog>();
        catalog
            .Setup(instance => instance.TrySubmitCompetitionAsync(
                "RO",
                "Liga Locală",
                CompetitionLevel.Amateur,
                CompetitionType.League,
                It.IsAny<Guid>(),
                5,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(submitted);
        var handler = new SubmitFootballCompetitionCommandHandler(catalog.Object);

        var result = await handler.Handle(
            new SubmitFootballCompetitionCommand(
                Guid.NewGuid(),
                "Romania",
                "Liga Locală",
                CompetitionLevel.Amateur,
                CompetitionType.League),
            CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(CompetitionLevel.Unknown, result.Value.Level);
        Assert.False(result.Value.IsVerified);
    }

    [Fact]
    public void SubmitCompetition_requires_a_non_unknown_level_hint()
    {
        var validator = new SubmitFootballCompetitionCommandValidator();

        var result = validator.Validate(new SubmitFootballCompetitionCommand(
            Guid.NewGuid(),
            "Romania",
            "Liga Locală",
            CompetitionLevel.Unknown,
            CompetitionType.League));

        Assert.False(result.IsValid);
        Assert.Contains(
            result.Errors,
            error => error.PropertyName == nameof(SubmitFootballCompetitionCommand.LevelHint));
    }
}
