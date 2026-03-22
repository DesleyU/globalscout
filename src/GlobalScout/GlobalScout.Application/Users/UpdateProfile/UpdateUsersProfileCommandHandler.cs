using System.Text.Json;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Application.Users;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Users.UpdateProfile;

internal sealed class UpdateUsersProfileCommandHandler(IUserDirectoryRepository users)
    : ICommandHandler<UpdateUsersProfileCommand, UsersFullProfileResult>
{
    public async Task<Result<UsersFullProfileResult>> Handle(
        UpdateUsersProfileCommand command,
        CancellationToken cancellationToken)
    {
        if (command.PlayerId is { Length: > 0 } rawPid && int.TryParse(rawPid, out var pid))
        {
            var taken = await users.PlayerIdExistsForAnotherUserAsync(pid, command.UserId, cancellationToken);
            if (taken)
            {
                return Result.Failure<UsersFullProfileResult>(UsersErrors.PlayerIdTaken);
            }

            await users.SetPlayerIdAsync(command.UserId, pid, cancellationToken);
        }
        else if (command.PlayerId is { Length: 0 })
        {
            await users.SetPlayerIdAsync(command.UserId, null, cancellationToken);
        }

        JsonDocument? statsDoc = null;
        if (command.StatsDataJson is { Length: > 0 } json)
        {
            try
            {
                statsDoc = JsonDocument.Parse(json);
            }
            catch (JsonException)
            {
                return Result.Failure<UsersFullProfileResult>(
                    Error.Validation("Users.StatsData.Invalid", "StatsData must be valid JSON."));
            }
        }

        var patch = new ProfileFieldPatch
        {
            FirstName = command.FirstName,
            LastName = command.LastName,
            Bio = command.Bio,
            Position = command.Position is null ? null : NormalizePosition(command.Position),
            Age = command.Age,
            Height = command.Height,
            Weight = command.Weight,
            Nationality = command.Nationality,
            ClubName = command.ClubName,
            ClubLogo = command.ClubLogo,
            Phone = command.Phone,
            Website = command.Website,
            Instagram = command.Instagram,
            Twitter = command.Twitter,
            Linkedin = command.Linkedin,
            Country = command.Country,
            City = command.City,
            StatsData = statsDoc
        };

        if (patch.HasAny || statsDoc is not null)
        {
            await users.UpdateProfileFieldsAsync(command.UserId, patch, cancellationToken);
        }

        var updated = await users.GetFullProfileAsync(command.UserId, cancellationToken);
        if (updated is null)
        {
            return Result.Failure<UsersFullProfileResult>(UsersErrors.UserNotFound);
        }

        return Result.Success(updated);
    }

    private static string? NormalizePosition(string value) =>
        value.Trim().ToUpperInvariant() switch
        {
            "GOALKEEPER" or "DEFENDER" or "MIDFIELDER" or "FORWARD" => value.Trim().ToUpperInvariant(),
            _ => null
        };
}
