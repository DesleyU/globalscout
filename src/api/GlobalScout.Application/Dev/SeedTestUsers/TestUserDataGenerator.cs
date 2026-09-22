using GlobalScout.Application.Abstractions.Dev;
using GlobalScout.Application.ReferenceData;

namespace GlobalScout.Application.Dev.SeedTestUsers;

/// <summary>Generates plausible fake profile data for dev-only test users. No persistence, pure logic.</summary>
internal static class TestUserDataGenerator
{
    public const string DefaultPassword = "abc123";

    private static readonly string[] FirstNames =
    [
        "Liam", "Noah", "Mateo", "Lucas", "Kwame", "Diego", "Yusuf", "Kenji", "Arjun", "Luca",
        "Sofia", "Mia", "Amara", "Elena", "Priya", "Hana", "Camila", "Freya", "Zara", "Ingrid",
    ];

    private static readonly string[] LastNames =
    [
        "Silva", "Garcia", "Johansson", "Nakamura", "Okafor", "Mendes", "Kowalski", "Rossi",
        "Andersen", "Haddad", "Novak", "Dubois", "Santos", "Muller", "Petrov", "Kim",
        "Okonkwo", "Fernandez", "Larsson", "Costa",
    ];

    private static readonly string[] ClubNameParts =
    [
        "Riverside", "Harbor City", "Athletic", "Northgate", "Union", "Meridian", "Coastal",
        "Highland", "Ironbridge", "Sunset Park",
    ];

    private static readonly string[] ClubSuffixes = ["FC", "United", "SC", "Athletic", "City"];

    public static TestUserCreationSpec Generate(string roleName, Random random)
    {
        var firstName = FirstNames[random.Next(FirstNames.Length)];
        var lastName = LastNames[random.Next(LastNames.Length)];
        var localPart = $"{firstName}.{lastName}-{Guid.NewGuid():N}".ToLowerInvariant();
        var email = localPart[..Math.Min(40, localPart.Length)] + "@example.com";

        var countries = FootballCountries.GetAll();
        var country = countries[random.Next(countries.Count)].Name;

        var isPlayer = string.Equals(roleName, "PLAYER", StringComparison.Ordinal);
        var isClub = string.Equals(roleName, "CLUB", StringComparison.Ordinal);

        int? age = isPlayer ? random.Next(16, 39) : null;
        string? position = isPlayer ? RandomPosition(random) : null;
        string? clubName = isPlayer || isClub
            ? $"{ClubNameParts[random.Next(ClubNameParts.Length)]} {ClubSuffixes[random.Next(ClubSuffixes.Length)]}"
            : null;

        return new TestUserCreationSpec(
            Email: email,
            Password: DefaultPassword,
            RoleName: roleName,
            FirstName: firstName,
            LastName: lastName,
            Age: age,
            Position: position,
            Nationality: isPlayer ? country : null,
            Country: country,
            City: null,
            ClubName: clubName);
    }

    private static string RandomPosition(Random random) =>
        random.Next(4) switch
        {
            0 => "GOALKEEPER",
            1 => "DEFENDER",
            2 => "MIDFIELDER",
            _ => "FORWARD",
        };
}
