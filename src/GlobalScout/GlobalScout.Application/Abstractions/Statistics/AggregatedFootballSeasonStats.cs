using System.Text.Json;

namespace GlobalScout.Application.Abstractions.Statistics;

/// <summary>Aggregated per-season numbers from API-Football (possibly multiple leagues).</summary>
public sealed record AggregatedFootballSeasonStats(
    int SeasonYear,
    int Goals,
    int Assists,
    int Appearances,
    int Minutes,
    int YellowCards,
    int RedCards,
    double? Rating,
    int? ShotsTotal,
    int? ShotsOnTarget,
    int? PassesTotal,
    double? PassesAccuracy,
    int? TacklesTotal,
    int? TacklesInterceptions,
    int? DuelsWon,
    int? FoulsCommitted,
    int? FoulsDrawn,
    JsonDocument DetailDocument);
