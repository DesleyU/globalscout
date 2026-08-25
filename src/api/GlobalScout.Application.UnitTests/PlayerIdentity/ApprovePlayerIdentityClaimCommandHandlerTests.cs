using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Application.PlayerIdentity.Admin.ApproveClaim;
using GlobalScout.Application.Statistics.RefreshMyStats;
using GlobalScout.Domain.Identity;
using GlobalScout.Domain.PlayerIdentity;
using GlobalScout.SharedKernel;
using Moq;
using Xunit;

namespace GlobalScout.Application.UnitTests.PlayerIdentity;

public sealed class ApprovePlayerIdentityClaimCommandHandlerTests
{
    private readonly Mock<IPlayerIdentityClaimRepository> _claims = new();
    private readonly Mock<IUserDirectoryRepository> _users = new();
    private readonly Mock<IAuditLogRepository> _auditLogs = new();
    private readonly Mock<IPlayerStatisticsRefreshExecutor> _statsRefresh = new();

    [Fact]
    public async Task Approve_syncs_profile_name_from_candidate_first_and_last()
    {
        var adminUserId = Guid.NewGuid();
        var claimId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var claim = CreateReviewableClaim(claimId, userId, "Robert", "Lewandowski");

        _claims.Setup(c => c.GetByIdWithEvidenceAsync(claimId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(claim);
        _users.Setup(u => u.PlayerIdExistsForAnotherUserAsync(claim.ExternalPlayerId!.Value, userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        _statsRefresh.Setup(s => s.ExecuteAsync(userId, false, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Success(new RefreshMyPlayerStatisticsResult(true, "Refreshed", null)));

        var handler = CreateHandler();
        var result = await handler.Handle(
            new ApprovePlayerIdentityClaimCommand
            {
                AdminUserId = adminUserId,
                ClaimId = claimId,
            },
            CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(ClaimStatus.Verified, claim.Status);

        _users.Verify(
            u => u.SetPlayerIdAsync(userId, claim.ExternalPlayerId!.Value, It.IsAny<CancellationToken>()),
            Times.Once);
        _users.Verify(
            u => u.UpdateProfileFieldsAsync(
                userId,
                It.Is<ProfileFieldPatch>(patch =>
                    patch.FirstName == "Robert" && patch.LastName == "Lewandowski"),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Approve_skips_profile_update_when_both_candidate_names_are_blank()
    {
        var adminUserId = Guid.NewGuid();
        var claimId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var claim = CreateReviewableClaim(claimId, userId, " ", " ");

        _claims.Setup(c => c.GetByIdWithEvidenceAsync(claimId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(claim);
        _users.Setup(u => u.PlayerIdExistsForAnotherUserAsync(claim.ExternalPlayerId!.Value, userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        _statsRefresh.Setup(s => s.ExecuteAsync(userId, false, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Success(new RefreshMyPlayerStatisticsResult(true, "Refreshed", null)));

        var handler = CreateHandler();
        var result = await handler.Handle(
            new ApprovePlayerIdentityClaimCommand
            {
                AdminUserId = adminUserId,
                ClaimId = claimId,
            },
            CancellationToken.None);

        Assert.True(result.IsSuccess);

        _users.Verify(
            u => u.UpdateProfileFieldsAsync(
                It.IsAny<Guid>(),
                It.IsAny<ProfileFieldPatch>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    private ApprovePlayerIdentityClaimCommandHandler CreateHandler() =>
        new(
            _claims.Object,
            _users.Object,
            _auditLogs.Object,
            _statsRefresh.Object);

    private static PlayerIdentityClaim CreateReviewableClaim(
        Guid claimId,
        Guid userId,
        string candidateFirstName,
        string candidateLastName)
    {
        var now = DateTimeOffset.UtcNow;

        return new PlayerIdentityClaim
        {
            Id = claimId,
            UserId = userId,
            ExternalPlayerId = 28003,
            ExternalProvider = "api-football",
            CandidateFirstName = candidateFirstName,
            CandidateLastName = candidateLastName,
            CandidateClub = "FC Barcelona",
            CandidatePosition = "Forward",
            CandidateNationality = "Poland",
            FullName = "John Smith",
            DateOfBirth = new DateOnly(1988, 8, 21),
            Nationality = "Poland",
            CurrentClub = "FC Barcelona",
            Position = Position.Forward,
            ConfidenceScore = 95,
            Status = ClaimStatus.PendingVerification,
            CreatedAt = now,
            UpdatedAt = now,
            Evidence =
            [
                new VerificationEvidence
                {
                    Id = Guid.NewGuid(),
                    ClaimId = claimId,
                    Type = EvidenceType.Other,
                    Url = "https://example.com/evidence",
                    CreatedAt = now,
                },
            ],
        };
    }
}
