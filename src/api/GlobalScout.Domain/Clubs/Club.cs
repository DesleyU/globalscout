namespace GlobalScout.Domain.Clubs;

public sealed class Club
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string? LogoUrl { get; set; }

    public string? Country { get; set; }

    public string? City { get; set; }

    public string? League { get; set; }

    public string? Website { get; set; }

    public string? Description { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }
}
