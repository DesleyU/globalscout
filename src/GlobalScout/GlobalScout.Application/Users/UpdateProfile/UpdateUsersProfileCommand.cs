using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Users;

namespace GlobalScout.Application.Users.UpdateProfile;

public sealed class UpdateUsersProfileCommand : ICommand<UsersFullProfileResult>
{
    public Guid UserId { get; init; }

    /// <summary>Raw value from JSON: omit to skip, empty string to clear, numeric string to set.</summary>
    public string? PlayerId { get; init; }

    public string? FirstName { get; init; }

    public string? LastName { get; init; }

    public string? Bio { get; init; }

    public string? Position { get; init; }

    public int? Age { get; init; }

    public int? Height { get; init; }

    public int? Weight { get; init; }

    public string? Nationality { get; init; }

    public string? ClubName { get; init; }

    public string? ClubLogo { get; init; }

    public string? Phone { get; init; }

    public string? Website { get; init; }

    public string? Instagram { get; init; }

    public string? Twitter { get; init; }

    public string? Linkedin { get; init; }

    public string? Country { get; init; }

    public string? City { get; init; }
}
