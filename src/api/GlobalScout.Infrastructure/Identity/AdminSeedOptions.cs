namespace GlobalScout.Infrastructure.Identity;

public sealed class AdminSeedOptions
{
    public const string SectionName = "AdminSeed";

    public string? Email { get; init; }

    public string? Password { get; init; }
}
