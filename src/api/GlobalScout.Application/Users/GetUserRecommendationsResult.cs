namespace GlobalScout.Application.Users;

public sealed record GetUserRecommendationsResult(IReadOnlyList<SearchUserItem> Recommendations);
