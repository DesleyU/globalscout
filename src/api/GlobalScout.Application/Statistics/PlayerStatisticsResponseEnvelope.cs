namespace GlobalScout.Application.Statistics;

/// <summary>Unified shape for <c>GET /stats/me</c> and <c>GET /stats/user/:id</c> (SPA expects <c>data</c>, <c>accountType</c>).</summary>
public sealed record PlayerStatisticsResponseEnvelope(
    bool Success,
    IReadOnlyList<object> Data,
    string AccountType,
    object AvailableFields,
    int TotalSeasons,
    string? Message);
