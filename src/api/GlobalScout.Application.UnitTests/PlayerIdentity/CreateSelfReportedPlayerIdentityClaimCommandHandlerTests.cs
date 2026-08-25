using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Application.PlayerIdentity.CreateSelfReportedClaim;
using GlobalScout.Domain.Identity;
using GlobalScout.Domain.PlayerIdentity;
using Moq;
using Xunit;

namespace GlobalScout.Application.UnitTests.PlayerIdentity;

public sealed class CreateSelfReportedPlayerIdentityClaimCommandHandlerTests
{
    private readonly Mock<IUserDirectoryRepository> _users = new();
    private readonly Mock<IPlayerIdentityClaimRepository> _claims = new();

    [Fact]
    public async Task Handle_creates_self_reported_claim_without_external_player_id()
    {
        var userId = Guid.NewGuid();
        _users.Setup(u => u.GetMediaUploadContextAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new MediaUploadContext(UserRole.Player, AccountType.Basic));
        _claims.Setup(c => c.GetActiveByUserIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((PlayerIdentityClaim?)null);

        var handler = new CreateSelfReportedPlayerIdentityClaimCommandHandler(_users.Object, _claims.Object);
        var result = await handler.Handle(
            new CreateSelfReportedPlayerIdentityClaimCommand
            {
                UserId = userId,
                FirstName = "Alex",
                LastName = "Popescu",
                DateOfBirth = new DateOnly(2008, 3, 12),
                Nationality = "Romania",
                CurrentCountry = "Romania",
                CurrentClub = "FC Voluntari U19",
                Position = "Forward",
                League = "Liga Elitelor",
            },
            CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(ClaimStatus.SelfReported.ToString(), result.Value.Status);
        Assert.Null(result.Value.ExternalPlayerId);

        _claims.Verify(
            c => c.AddAsync(
                It.Is<PlayerIdentityClaim>(claim =>
                    claim.Status == ClaimStatus.SelfReported
                    && claim.ExternalPlayerId == null
                    && claim.ExternalProvider == "self-reported"),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
