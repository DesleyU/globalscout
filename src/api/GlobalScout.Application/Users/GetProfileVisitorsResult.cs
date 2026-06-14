namespace GlobalScout.Application.Users;

public sealed record VisitorTypeCount(string Type, int Count);

public sealed record ProfileVisitorEntry(
    Guid Id,
    string VisitorType,
    DateTimeOffset VisitedAt,
    VisitorSummary Visitor);

public sealed record VisitorSummary(
    Guid Id,
    string Role,
    VisitorProfileSnippet Profile);

public sealed record VisitorProfileSnippet(
    string? FirstName,
    string? LastName,
    string? Avatar,
    string? ClubName);

public sealed record GetProfileVisitorsResult(
    string Tier,
    string? Message,
    IReadOnlyList<VisitorTypeCount> Stats,
    int TotalVisitors,
    IReadOnlyList<ProfileVisitorEntry>? Visitors);
