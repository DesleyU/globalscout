using System.Globalization;
using GlobalScout.Application.Abstractions.PlayerIdentity;
using GlobalScout.Application.Common;

namespace GlobalScout.Application.PlayerIdentity.Matching;

internal static class NameMatcher
{
    public static bool NamesMatch(PlayerSearchCriteria criteria, ExternalPlayerCandidate candidate) =>
        FirstNamesMatch(criteria.FirstName, candidate.FirstName)
        && LastNamesMatch(criteria.LastName, candidate.LastName);

    public static bool FirstNamesMatch(string left, string right) =>
        WordsCover(SplitNameWords(left), SplitNameWords(right));

    public static bool LastNamesMatch(string left, string right)
    {
        var leftWords = SplitNameWords(left);
        var rightWords = SplitNameWords(right);

        if (leftWords.Length == 0 || rightWords.Length == 0)
        {
            return false;
        }

        return StringSimilarity.IsSimilarWord(leftWords[^1], rightWords[^1])
               && WordsCover(leftWords, rightWords);
    }

    internal static string[] SplitNameWords(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return [];
        }

        return TextNormalizer.RemoveDiacritics(value)
            .ToLower(CultureInfo.InvariantCulture)
            .Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries);
    }

    private static bool WordsCover(string[] requiredWords, string[] candidateWords)
    {
        if (requiredWords.Length == 0)
        {
            return false;
        }

        if (candidateWords.Length < requiredWords.Length)
        {
            return false;
        }

        var usedCandidateIndexes = new bool[candidateWords.Length];

        foreach (var requiredWord in requiredWords)
        {
            var matched = false;

            for (var index = 0; index < candidateWords.Length; index++)
            {
                if (usedCandidateIndexes[index])
                {
                    continue;
                }

                if (!StringSimilarity.IsSimilarWord(requiredWord, candidateWords[index]))
                {
                    continue;
                }

                usedCandidateIndexes[index] = true;
                matched = true;
                break;
            }

            if (!matched)
            {
                return false;
            }
        }

        return true;
    }
}
