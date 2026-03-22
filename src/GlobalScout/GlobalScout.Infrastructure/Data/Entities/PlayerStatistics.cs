using GlobalScout.Infrastructure.Identity;

namespace GlobalScout.Infrastructure.Data.Entities;

public sealed class PlayerStatistics
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public ApplicationUser User { get; set; } = null!;

    public string Season { get; set; } = string.Empty;

    public int Goals { get; set; }

    public int Assists { get; set; }

    public int Matches { get; set; }

    public int Minutes { get; set; }

    public int YellowCards { get; set; }

    public int RedCards { get; set; }

    public double? Rating { get; set; }

    public int? ShotsTotal { get; set; }

    public int? ShotsOnTarget { get; set; }

    public int? PassesTotal { get; set; }

    public double? PassesAccuracy { get; set; }

    public int? TacklesTotal { get; set; }

    public int? TacklesInterceptions { get; set; }

    public int? DuelsWon { get; set; }

    public int? FoulsCommitted { get; set; }

    public int? FoulsDrawn { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }
}
