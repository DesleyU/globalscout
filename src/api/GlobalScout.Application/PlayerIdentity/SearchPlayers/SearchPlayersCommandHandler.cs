using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Application.Abstractions.PlayerIdentity;
using GlobalScout.Application.Auth;
using GlobalScout.Application.PlayerIdentity.Matching;
using GlobalScout.Domain.Identity;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.PlayerIdentity.SearchPlayers;

internal sealed class SearchPlayersCommandHandler(
    IUserDirectoryRepository users,
    IExternalPlayerSearch externalPlayerSearch)
    : ICommandHandler<SearchPlayersCommand, SearchPlayersResult>
{
    public async Task<Result<SearchPlayersResult>> Handle(
        SearchPlayersCommand command,
        CancellationToken cancellationToken)
    {
        var access = await PlayerIdentityAccess.EnsurePlayerAsync(users, command.UserId, cancellationToken);
        if (access.IsFailure)
        {
            return Result.Failure<SearchPlayersResult>(access.Error);
        }

        if (!AuthPositionParser.TryParse(command.Position, out var position))
        {
            return Result.Failure<SearchPlayersResult>(PlayerIdentityErrors.InvalidPosition);
        }

        var criteria = new PlayerSearchCriteria(
            command.FirstName.Trim(),
            command.LastName.Trim(),
            command.DateOfBirth,
            command.Nationality.Trim(),
            command.CurrentCountry.Trim(),
            command.CurrentTeamId,
            command.CurrentTeamName.Trim(),
            position,
            string.IsNullOrWhiteSpace(command.PreviousClub) ? null : command.PreviousClub.Trim(),
            string.IsNullOrWhiteSpace(command.League) ? null : command.League.Trim());

        var search = await externalPlayerSearch.SearchAsync(criteria, cancellationToken);
        if (search.IsFailure)
        {
            return Result.Failure<SearchPlayersResult>(search.Error);
        }

        var matches = search.Value
            .Select(candidate =>
            {
                var score = ConfidenceScorer.Score(criteria, candidate);
                return PlayerIdentityMapper.ToMatchDto(candidate, score);
            })
            .OrderByDescending(m => m.ConfidenceScore)
            .ThenBy(m => m.Name, StringComparer.OrdinalIgnoreCase)
            .ToArray();

        return Result.Success(new SearchPlayersResult(matches));
    }
}
