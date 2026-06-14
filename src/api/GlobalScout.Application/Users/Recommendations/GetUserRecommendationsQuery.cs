using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Users;
using GlobalScout.Domain.Identity;

namespace GlobalScout.Application.Users.Recommendations;

public sealed record GetUserRecommendationsQuery(Guid CurrentUserId, UserRole CurrentRole, int Limit)
    : IQuery<GetUserRecommendationsResult>;
