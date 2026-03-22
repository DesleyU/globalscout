namespace GlobalScout.Domain.Identity;

/// <summary>ASP.NET Identity role names (aligned with legacy string values).</summary>
public static class AppRoleNames
{
    public const string Player = "PLAYER";
    public const string Club = "CLUB";
    public const string ScoutAgent = "SCOUT_AGENT";
    public const string Admin = "ADMIN";

    public static readonly string[] All = [Player, Club, ScoutAgent, Admin];

    public static UserRole ToUserRole(string roleName) =>
        roleName switch
        {
            Player => UserRole.Player,
            Club => UserRole.Club,
            ScoutAgent => UserRole.ScoutAgent,
            Admin => UserRole.Admin,
            _ => UserRole.Player
        };

    public static string FromUserRole(UserRole role) =>
        role switch
        {
            UserRole.Player => Player,
            UserRole.Club => Club,
            UserRole.ScoutAgent => ScoutAgent,
            UserRole.Admin => Admin,
            _ => Player
        };
}
