using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Application.Abstractions.PlayerIdentity;
using GlobalScout.Application.Auth;
using GlobalScout.Application.PlayerIdentity.Matching;
using GlobalScout.Domain.PlayerIdentity;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.PlayerIdentity.CreateClaim;

internal sealed class CreatePlayerIdentityClaimCommandHandler(
    IUserDirectoryRepository users,
    IPlayerIdentityClaimRepository claims,
    IExternalPlayerSearch externalPlayerSearch)
    : ICommandHandler<CreatePlayerIdentityClaimCommand, PlayerIdentityClaimDto>
{
    public async Task<Result<PlayerIdentityClaimDto>> Handle(
        CreatePlayerIdentityClaimCommand command,
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

        var criteria = new PlayerSearchCriteria(
            command.FirstName.Trim(),
            command.LastName.Trim(),
            command.DateOfBirth,
            command.Nationality.Trim(),
            command.CurrentCountry.Trim(),
            command.CurrentTeamId,
            command.CurrentClub.Trim(),
            position,
            string.IsNullOrWhiteSpace(command.PreviousClub) ? null : command.PreviousClub.Trim(),
            string.IsNullOrWhiteSpace(command.League) ? null : command.League.Trim());

        var search = await externalPlayerSearch.SearchAsync(criteria, cancellationToken);
        if (search.IsFailure)
        {
            return Result.Failure<PlayerIdentityClaimDto>(search.Error);
        }

        var provider = string.IsNullOrWhiteSpace(command.Provider)
            ? ExternalPlayerProviders.ApiFootball
            : command.Provider.Trim();

        var candidate = search.Value.FirstOrDefault(
            c => c.ExternalPlayerId == command.ExternalPlayerId
                 && string.Equals(c.Provider, provider, StringComparison.OrdinalIgnoreCase));

        if (candidate is null)
        {
            return Result.Failure<PlayerIdentityClaimDto>(PlayerIdentityErrors.CandidateNotFound);
        }

        var taken = await users.PlayerIdExistsForAnotherUserAsync(command.ExternalPlayerId, command.UserId, cancellationToken);
        if (taken)
        {
            return Result.Failure<PlayerIdentityClaimDto>(PlayerIdentityErrors.ExternalPlayerIdTaken);
        }

        var score = ConfidenceScorer.Score(criteria, candidate);
        var now = DateTimeOffset.UtcNow;
        var claimPayload = BuildClaim(command.UserId, criteria, candidate, score.Score, now);

        var activeClaim = await claims.GetActiveByUserIdAsync(command.UserId, cancellationToken);
        if (activeClaim is not null)
        {
            if (activeClaim.Status == ClaimStatus.Claimed)
            {
                claimPayload.Id = activeClaim.Id;
                claimPayload.CreatedAt = activeClaim.CreatedAt;

                var replaced = await claims.ReplaceClaimedCandidateAsync(claimPayload, cancellationToken);
                if (replaced is null)
                {
                    return Result.Failure<PlayerIdentityClaimDto>(PlayerIdentityErrors.ClaimAlreadyExists);
                }

                return Result.Success(PlayerIdentityMapper.ToClaimDto(replaced));
            }

            if (ClaimStatusRules.BlocksNewClaim(activeClaim.Status))
            {
                return Result.Failure<PlayerIdentityClaimDto>(PlayerIdentityErrors.ClaimAlreadyExists);
            }
        }

        await claims.AddAsync(claimPayload, cancellationToken);

        return Result.Success(PlayerIdentityMapper.ToClaimDto(claimPayload));
    }

    private static PlayerIdentityClaim BuildClaim(
        Guid userId,
        PlayerSearchCriteria criteria,
        ExternalPlayerCandidate candidate,
        int confidenceScore,
        DateTimeOffset now) =>
        new()
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            ExternalPlayerId = candidate.ExternalPlayerId,
            ExternalProvider = candidate.Provider,
            CandidateFirstName = candidate.FirstName,
            CandidateLastName = candidate.LastName,
            CandidateClub = candidate.Club,
            CandidatePosition = candidate.Position,
            CandidateNationality = candidate.Nationality,
            CandidateAge = candidate.Age,
            CandidatePhotoUrl = candidate.PhotoUrl,
            FullName = criteria.DisplayName,
            DateOfBirth = criteria.DateOfBirth,
            Nationality = criteria.Nationality,
            CurrentClub = criteria.CurrentClub,
            PreviousClub = criteria.PreviousClub,
            Position = criteria.Position,
            League = criteria.League,
            ConfidenceScore = confidenceScore,
            Status = ClaimStatus.Claimed,
            CreatedAt = now,
            UpdatedAt = now,
        };
}
