namespace GlobalScout.Application.PlayerIdentity.Matching;

public enum ConfidenceBucket
{
    Low = 0,
    Medium = 1,
    High = 2
}

public sealed record ConfidenceMatchResult(
    int Score,
    ConfidenceBucket Bucket,
    IReadOnlyList<string> Reasons);
