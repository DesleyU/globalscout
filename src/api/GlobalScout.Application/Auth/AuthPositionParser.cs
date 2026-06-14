using GlobalScout.Domain.Identity;

namespace GlobalScout.Application.Auth;

internal static class AuthPositionParser
{
    public static bool TryParse(string value, out Position position)
    {
        position = default;
        switch (value.Trim().ToUpperInvariant())
        {
            case "GOALKEEPER":
                position = Position.Goalkeeper;
                return true;
            case "DEFENDER":
                position = Position.Defender;
                return true;
            case "MIDFIELDER":
                position = Position.Midfielder;
                return true;
            case "FORWARD":
                position = Position.Forward;
                return true;
            default:
                return false;
        }
    }
}
