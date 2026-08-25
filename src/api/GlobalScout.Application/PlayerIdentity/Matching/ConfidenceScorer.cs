using System.Globalization;
using GlobalScout.Application.Abstractions.PlayerIdentity;
using GlobalScout.Application.Common;
using GlobalScout.Domain.Identity;
namespace GlobalScout.Application.PlayerIdentity.Matching;

public static class ConfidenceScorer
{
    private const int DateOfBirthPoints = 38;
    private const int NamePoints = 32;
    private const int CurrentClubPoints = 22;
    private const int PreviousClubPoints = 3;
    private const int NationalityPoints = 2;
    private const int PositionPoints = 2;
    private const int AgePoints = 1;
    private const int LeaguePoints = 1;

    public static ConfidenceMatchResult Score(PlayerSearchCriteria criteria, ExternalPlayerCandidate candidate)
    {
        var reasons = new List<string>();
        var score = 0;

        if (NameMatcher.NamesMatch(criteria, candidate))
        {
            score += NamePoints;
            reasons.Add("Name match");
        }
        if (DateOfBirthMatches(criteria.DateOfBirth, candidate.DateOfBirth))
        {
            score += DateOfBirthPoints;
            reasons.Add("Date of birth match");
        }

        if (ClubsMatch(criteria.CurrentClub, candidate.Club))
        {
            score += CurrentClubPoints;
            reasons.Add("Current club match");
        }

        if (!string.IsNullOrWhiteSpace(criteria.PreviousClub)
            && !string.IsNullOrWhiteSpace(candidate.PreviousClub)
            && ClubsMatch(criteria.PreviousClub, candidate.PreviousClub))
        {
            score += PreviousClubPoints;
            reasons.Add("Previous club match");
        }

        if (NationalitiesMatch(criteria.Nationality, candidate.Nationality))
        {
            score += NationalityPoints;
            reasons.Add("Nationality match");
        }

        if (PositionsMatch(criteria.Position, candidate.Position))
        {
            score += PositionPoints;
            reasons.Add("Position match");
        }

        if (candidate.DateOfBirth is null && AgesMatch(criteria.DateOfBirth, candidate.Age))
        {
            score += AgePoints;
            reasons.Add("Age match");
        }

        if (!string.IsNullOrWhiteSpace(criteria.League)
            && !string.IsNullOrWhiteSpace(candidate.League)
            && LeaguesMatch(criteria.League, candidate.League))
        {
            score += LeaguePoints;
            reasons.Add("League match");
        }

        score = Math.Clamp(score, 0, 100);
        return new ConfidenceMatchResult(score, ToBucket(score), reasons);
    }

    public static bool IsRecommended(ConfidenceMatchResult result) =>
        result.Bucket == ConfidenceBucket.High;

    private static ConfidenceBucket ToBucket(int score) => score switch
    {
        >= 90 => ConfidenceBucket.High,
        >= 60 => ConfidenceBucket.Medium,
        _ => ConfidenceBucket.Low
    };

    private static bool DateOfBirthMatches(DateOnly criteriaDateOfBirth, DateOnly? candidateDateOfBirth) =>        candidateDateOfBirth == criteriaDateOfBirth;

    private static bool ClubsMatch(string left, string right)
    {
        var normalizedLeft = NormalizeClub(left);
        var normalizedRight = NormalizeClub(right);

        if (normalizedLeft == normalizedRight)
        {
            return true;
        }

        return normalizedLeft.Contains(normalizedRight, StringComparison.Ordinal)
               || normalizedRight.Contains(normalizedLeft, StringComparison.Ordinal);
    }

    private static bool NationalitiesMatch(string left, string right) =>
        NormalizeText(left) == NormalizeText(right);

    private static bool LeaguesMatch(string left, string right) =>
        NormalizeText(left) == NormalizeText(right);

    private static bool PositionsMatch(Position criteriaPosition, string candidatePosition)
    {
        var normalizedCandidate = NormalizeText(candidatePosition);

        foreach (var alias in GetPositionAliases(criteriaPosition))
        {
            if (normalizedCandidate.Contains(alias, StringComparison.Ordinal))
            {
                return true;
            }
        }

        return false;
    }

    private static bool AgesMatch(DateOnly criteriaDateOfBirth, int? candidateAge)
    {
        if (candidateAge is null)
        {
            return false;
        }

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var computedAge = criteriaDateOfBirth.AddYears(today.Year - criteriaDateOfBirth.Year) > today
            ? today.Year - criteriaDateOfBirth.Year - 1
            : today.Year - criteriaDateOfBirth.Year;

        return Math.Abs(computedAge - candidateAge.Value) <= 1;
    }

    private static IEnumerable<string> GetPositionAliases(Position position) => position switch
    {
        Position.Goalkeeper => ["goalkeeper", "keeper", "gk"],
        Position.Defender => ["defender", "defence", "defense", "back"],
        Position.Midfielder => ["midfielder", "midfield", "mf"],
        Position.Forward => ["forward", "attacker", "striker", "wing"],
        _ => []
    };

    private static string NormalizeText(string value) =>
        string.Join(
            ' ',
            TextNormalizer.RemoveDiacritics(value)
                .Trim()
                .ToLower(CultureInfo.InvariantCulture)
                .Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries));
    private static string NormalizeClub(string value)
    {
        var normalized = NormalizeText(value);

        foreach (var prefix in new[] { "fc ", "cf ", "sc ", "ac ", "club " })
        {
            if (normalized.StartsWith(prefix, StringComparison.Ordinal))
            {
                normalized = normalized[prefix.Length..].Trim();
            }
        }

        foreach (var suffix in new[] { " fc", " cf", " sc" })
        {
            if (normalized.EndsWith(suffix, StringComparison.Ordinal))
            {
                normalized = normalized[..^suffix.Length].Trim();
            }
        }

        return normalized;
    }
}
