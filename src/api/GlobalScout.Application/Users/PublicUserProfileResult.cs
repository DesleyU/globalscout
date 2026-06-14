using GlobalScout.Domain.Identity;

namespace GlobalScout.Application.Users;

public sealed record PublicUserProfileResult(
    Guid Id,
    string Role,
    string AccountType,
    AccountType AccountTypeValue,
    UserProfileApiDto? Profile,
    string SubscriptionTier);

public sealed record GetUserByPublicProfileResult(PublicUserProfileResult User);
