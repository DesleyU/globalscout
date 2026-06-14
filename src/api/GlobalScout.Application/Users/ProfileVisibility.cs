using GlobalScout.Domain.Identity;

namespace GlobalScout.Application.Users;

internal static class ProfileVisibility
{
    /// <summary>Legacy basic tier only exposes a subset of profile fields to other users.</summary>
    public static UserProfileApiDto? ForPublicView(AccountType viewerSeesTier, UserProfileApiDto? full)
    {
        if (full is null)
        {
            return null;
        }

        if (viewerSeesTier == AccountType.Premium)
        {
            return full;
        }

        return full with
        {
            Bio = null,
            Height = null,
            Weight = null,
            Nationality = null,
            ClubLogo = null,
            Phone = null,
            Website = null,
            Instagram = null,
            Twitter = null,
            Linkedin = null,
            Country = null,
            City = null
        };
    }
}
