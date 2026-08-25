namespace GlobalScout.Application.PlayerIdentity.Matching;

internal static class StringSimilarity
{
    public static int LevenshteinDistance(string left, string right)
    {
        if (left.Length == 0)
        {
            return right.Length;
        }

        if (right.Length == 0)
        {
            return left.Length;
        }

        var previousRow = new int[right.Length + 1];
        var currentRow = new int[right.Length + 1];

        for (var column = 0; column <= right.Length; column++)
        {
            previousRow[column] = column;
        }

        for (var row = 1; row <= left.Length; row++)
        {
            currentRow[0] = row;

            for (var column = 1; column <= right.Length; column++)
            {
                var substitutionCost = left[row - 1] == right[column - 1] ? 0 : 1;
                currentRow[column] = Math.Min(
                    Math.Min(currentRow[column - 1] + 1, previousRow[column] + 1),
                    previousRow[column - 1] + substitutionCost);
            }

            (previousRow, currentRow) = (currentRow, previousRow);
        }

        return previousRow[right.Length];
    }

    public static bool IsSimilarWord(string left, string right)
    {
        if (string.IsNullOrEmpty(left) || string.IsNullOrEmpty(right))
        {
            return false;
        }

        if (left == right)
        {
            return true;
        }

        if (IsInitialMatch(left, right))
        {
            return true;
        }

        var maxLength = Math.Max(left.Length, right.Length);
        if (maxLength < 5)
        {
            return false;
        }

        return LevenshteinDistance(left, right) <= 1;
    }

    private static bool IsInitialMatch(string left, string right)
    {
        var leftInitial = left.TrimEnd('.');
        var rightInitial = right.TrimEnd('.');

        if (leftInitial.Length == 1 && right.StartsWith(leftInitial, StringComparison.Ordinal))
        {
            return true;
        }

        if (rightInitial.Length == 1 && left.StartsWith(rightInitial, StringComparison.Ordinal))
        {
            return true;
        }

        return false;
    }
}
