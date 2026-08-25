using System.Globalization;
using System.Text;

namespace GlobalScout.Application.Common;

public static class TextNormalizer
{
    public static string RemoveDiacritics(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        var normalized = value.Normalize(NormalizationForm.FormKD);
        var builder = new StringBuilder(normalized.Length);

        foreach (var character in normalized)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(character) != UnicodeCategory.NonSpacingMark)
            {
                builder.Append(character);
            }
        }

        var result = builder.ToString().Normalize(NormalizationForm.FormC);
        return ApplyCompatibilityReplacements(result);
    }

    private static string ApplyCompatibilityReplacements(string value) =>
        value
            .Replace("ß", "ss", StringComparison.Ordinal)
            .Replace('ł', 'l')
            .Replace('Ł', 'L');

    public static string ToSearchKey(string value) =>
        string.IsNullOrWhiteSpace(value)
            ? string.Empty
            : RemoveDiacritics(value.Trim()).ToLowerInvariant();

    public static string ToApiFootballSearchTerm(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        var withoutDiacritics = RemoveDiacritics(value.Trim());
        var builder = new StringBuilder(withoutDiacritics.Length);
        var previousWasSpace = false;

        foreach (var character in withoutDiacritics)
        {
            if (char.IsAsciiLetterOrDigit(character))
            {
                builder.Append(character);
                previousWasSpace = false;
                continue;
            }

            if (character == ' ' && !previousWasSpace && builder.Length > 0)
            {
                builder.Append(' ');
                previousWasSpace = true;
            }
        }

        return builder.ToString().Trim();
    }
}
