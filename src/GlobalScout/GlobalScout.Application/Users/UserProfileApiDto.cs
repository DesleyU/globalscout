using System.Text.Json.Serialization;

namespace GlobalScout.Application.Users;

/// <summary>Profile fields aligned with the legacy API shape (camelCase via JSON).</summary>
public sealed record UserProfileApiDto(
    [property: JsonPropertyName("id")] Guid UserId,
    string FirstName,
    string LastName,
    string? Avatar,
    string? Bio,
    string? Position,
    int? Age,
    int? Height,
    int? Weight,
    string? Nationality,
    string? ClubName,
    string? ClubLogo,
    string? Phone,
    string? Website,
    string? Instagram,
    string? Twitter,
    string? Linkedin,
    string? Country,
    string? City,
    object? StatsData,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);
