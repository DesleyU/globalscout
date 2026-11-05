using System.Globalization;
using System.Text;

namespace GlobalScout.Domain.Social;

/// <summary>
/// An opaque keyset cursor for paginating a conversation's messages by <c>(CreatedAt, Id)</c>, newest-first.
/// </summary>
public readonly record struct MessageCursor(DateTimeOffset CreatedAt, Guid Id)
{
    public string Encode() =>
        Convert.ToBase64String(Encoding.UTF8.GetBytes($"{CreatedAt:O}|{Id}"));

    public static bool TryParse(string? value, out MessageCursor cursor)
    {
        cursor = default;
        if (string.IsNullOrEmpty(value))
        {
            return false;
        }

        try
        {
            string raw = Encoding.UTF8.GetString(Convert.FromBase64String(value));
            string[] parts = raw.Split('|', 2);
            if (parts.Length != 2
                || !DateTimeOffset.TryParse(parts[0], CultureInfo.InvariantCulture, DateTimeStyles.None, out var createdAt)
                || !Guid.TryParse(parts[1], out var id))
            {
                return false;
            }

            cursor = new MessageCursor(createdAt, id);
            return true;
        }
        catch (FormatException)
        {
            return false;
        }
    }
}
