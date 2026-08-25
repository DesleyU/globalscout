using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Application.Abstractions.PlayerIdentity;
using GlobalScout.Application.Auth;
using GlobalScout.Domain.PlayerIdentity;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.PlayerIdentity.CreateSelfReportedClaim;

internal sealed class CreateSelfReportedPlayerIdentityClaimCommandHandler(
    IUserDirectoryRepository users,
    IPlayerIdentityClaimRepository claims)
    : ICommandHandler<CreateSelfReportedPlayerIdentityClaimCommand, PlayerIdentityClaimDto>
{
    public async Task<Result<PlayerIdentityClaimDto>> Handle(
        CreateSelfReportedPlayerIdentityClaimCommand command,
        CancellationToken cancellationToken)
    {
        var access = await PlayerIdentityAccess.EnsurePlayerAsync(users, command.UserId, cancellationToken);
        if (access.IsFailure)
        {
            return Result.Failure<PlayerIdentityClaimDto>(access.Error);
        }

        if (!AuthPositionParser.TryParse(command.Position, out var position))
        {
            return Result.Failure<PlayerIdentityClaimDto>(PlayerIdentityErrors.InvalidPosition);
        }

        var activeClaim = await claims.GetActiveByUserIdAsync(command.UserId, cancellationToken);
        if (activeClaim is not null && ClaimStatusRules.BlocksNewClaim(activeClaim.Status))
        {
            return Result.Failure<PlayerIdentityClaimDto>(PlayerIdentityErrors.ClaimAlreadyExists);
        }

        var now = DateTimeOffset.UtcNow;
        var fullName = $"{command.FirstName.Trim()} {command.LastName.Trim()}";
        var currentClub = command.CurrentClub.Trim();
        var nationality = command.Nationality.Trim();

        var claim = new PlayerIdentityClaim
        {
            Id = Guid.NewGuid(),
            UserId = command.UserId,
            ExternalPlayerId = null,
            ExternalProvider = ExternalPlayerProviders.SelfReported,
            CandidateFirstName = command.FirstName.Trim(),
            CandidateLastName = command.LastName.Trim(),
            CandidateClub = currentClub,
            CandidatePosition = position.ToString(),
            CandidateNationality = nationality,
            CandidateAge = ComputeAge(command.DateOfBirth, now),
            CandidatePhotoUrl = null,
            FullName = fullName,
            DateOfBirth = command.DateOfBirth,
            Nationality = nationality,
            CurrentClub = currentClub,
            PreviousClub = string.IsNullOrWhiteSpace(command.PreviousClub)
                ? null
                : command.PreviousClub.Trim(),
            Position = position,
            League = string.IsNullOrWhiteSpace(command.League) ? null : command.League.Trim(),
            ConfidenceScore = 0,
            Status = ClaimStatus.SelfReported,
            CreatedAt = now,
            UpdatedAt = now,
        };

        await claims.AddAsync(claim, cancellationToken);

        return Result.Success(PlayerIdentityMapper.ToClaimDto(claim));
    }

    private static int? ComputeAge(DateOnly dateOfBirth, DateTimeOffset asOf)
    {
        var today = DateOnly.FromDateTime(asOf.UtcDateTime);
        var age = today.Year - dateOfBirth.Year;
        if (dateOfBirth > today.AddYears(-age))
        {
            age--;
        }

        return age >= 0 ? age : null;
    }
}
