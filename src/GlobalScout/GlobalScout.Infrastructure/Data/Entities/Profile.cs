using System.Text.Json;
using GlobalScout.Domain.Identity;
using GlobalScout.Infrastructure.Identity;

namespace GlobalScout.Infrastructure.Data.Entities;

public sealed class Profile
{
    public Guid UserId { get; set; }

    public ApplicationUser User { get; set; } = null!;

    public string FirstName { get; set; } = string.Empty;

    public string LastName { get; set; } = string.Empty;

    public string? Avatar { get; set; }

    public string? Bio { get; set; }

    public Position? Position { get; set; }

    public int? Age { get; set; }

    public int? Height { get; set; }

    public int? Weight { get; set; }

    public string? Nationality { get; set; }

    public string? ClubName { get; set; }

    public string? ClubLogo { get; set; }

    public string? Phone { get; set; }

    public string? Website { get; set; }

    public string? Instagram { get; set; }

    public string? Twitter { get; set; }

    public string? Linkedin { get; set; }

    public string? Country { get; set; }

    public string? City { get; set; }

    public JsonDocument? StatsData { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }
}
