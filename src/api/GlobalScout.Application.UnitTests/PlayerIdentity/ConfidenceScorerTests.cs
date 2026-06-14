using GlobalScout.Application.Abstractions.PlayerIdentity;
using GlobalScout.Application.PlayerIdentity.Matching;
using GlobalScout.Domain.Identity;
using Xunit;

namespace GlobalScout.Application.UnitTests.PlayerIdentity;

public sealed class ConfidenceScorerTests
{
    private static readonly DateOnly DateOfBirth = new(2003, 4, 12);

    private static PlayerSearchCriteria CreateCriteria(
        string? previousClub = null,
        string? league = null) =>
        new(
            FirstName: "Pedri",
            LastName: "Gonzalez",
            DateOfBirth: DateOfBirth,
            Nationality: "Spain",
            CurrentCountry: "Spain",
            CurrentTeamId: 529,
            CurrentClub: "FC Barcelona",
            Position: Position.Midfielder,
            PreviousClub: previousClub,
            League: league);

    private static ExternalPlayerCandidate CreateCandidate(
        string firstName = "Pedri",
        string lastName = "Gonzalez",
        string name = "Pedri Gonzalez",
        string club = "FC Barcelona",
        DateOnly? dateOfBirth = null,
        int? age = null,
        string? previousClub = null,
        string? league = null,
        string nationality = "Spain",
        string position = "Midfielder") =>
        new(
            ExternalPlayerId: 1,
            Provider: ExternalPlayerProviders.ApiFootball,
            FirstName: firstName,
            LastName: lastName,
            Name: name,
            Club: club,
            Position: position,
            Nationality: nationality,
            Age: age,
            DateOfBirth: dateOfBirth,
            PhotoUrl: null,
            PreviousClub: previousClub,
            League: league);

    [Fact]
    public void Score_matches_api_football_first_and_last_name_fields()
    {
        var criteria = new PlayerSearchCriteria(
            FirstName: "Ianis",
            LastName: "Hagi",
            DateOfBirth: new DateOnly(1998, 10, 22),
            Nationality: "Romania",
            CurrentCountry: "Romania",
            CurrentTeamId: 559,
            CurrentClub: "FCSB",
            Position: Position.Midfielder);

        var result = ConfidenceScorer.Score(
            criteria,
            CreateCandidate(
                firstName: "Ianis",
                lastName: "Hagi",
                name: "I. Hagi",
                club: "FCSB",
                dateOfBirth: new DateOnly(1998, 10, 22),
                nationality: "Romania",
                position: "Midfielder"));

        Assert.Contains("Exact name match", result.Reasons);
    }

    [Fact]
    public void Score_returns_high_bucket_when_name_dob_and_club_match()
    {
        var result = ConfidenceScorer.Score(
            CreateCriteria(),
            CreateCandidate(dateOfBirth: DateOfBirth));

        Assert.InRange(result.Score, 90, 100);
        Assert.Equal(ConfidenceBucket.High, result.Bucket);
        Assert.True(ConfidenceScorer.IsRecommended(result));
        Assert.Contains("Exact name match", result.Reasons);
        Assert.Contains("Date of birth match", result.Reasons);
        Assert.Contains("Current club match", result.Reasons);
    }

    [Fact]
    public void Score_returns_medium_bucket_for_partial_match()
    {
        var result = ConfidenceScorer.Score(
            CreateCriteria(),
            CreateCandidate(
                club: "Real Zaragoza",
                dateOfBirth: DateOfBirth));

        Assert.InRange(result.Score, 60, 89);
        Assert.Equal(ConfidenceBucket.Medium, result.Bucket);
        Assert.False(ConfidenceScorer.IsRecommended(result));
        Assert.Contains("Exact name match", result.Reasons);
        Assert.Contains("Date of birth match", result.Reasons);
        Assert.DoesNotContain("Current club match", result.Reasons);
    }

    [Fact]
    public void Score_returns_low_bucket_for_weak_match()
    {
        var result = ConfidenceScorer.Score(
            CreateCriteria(),
            CreateCandidate(
                firstName: "Another",
                lastName: "Player",
                name: "Another Player",
                club: "Real Zaragoza",
                dateOfBirth: new DateOnly(1999, 1, 1),
                age: 27,
                previousClub: "Sevilla",
                league: "La Liga",
                nationality: "Brazil",
                position: "Forward"));

        Assert.True(result.Score < 60);
        Assert.Equal(ConfidenceBucket.Low, result.Bucket);
        Assert.Empty(result.Reasons);
    }

    [Fact]
    public void Score_adds_optional_factor_reasons_when_data_is_available()
    {
        var result = ConfidenceScorer.Score(
            CreateCriteria(previousClub: "Las Palmas", league: "La Liga"),
            CreateCandidate(
                dateOfBirth: DateOfBirth,
                previousClub: "Las Palmas",
                league: "La Liga"));

        Assert.Equal(100, result.Score);
        Assert.Contains("Previous club match", result.Reasons);
        Assert.Contains("Nationality match", result.Reasons);
        Assert.Contains("Position match", result.Reasons);
        Assert.Contains("League match", result.Reasons);
    }

    [Fact]
    public void Score_uses_age_when_candidate_has_no_date_of_birth()
    {
        var result = ConfidenceScorer.Score(
            CreateCriteria(),
            CreateCandidate(
                dateOfBirth: null,
                age: ComputeAge(DateOfBirth)));

        Assert.Contains("Age match", result.Reasons);
        Assert.DoesNotContain("Date of birth match", result.Reasons);
    }

    [Fact]
    public void Score_normalizes_club_names_before_matching()
    {
        var result = ConfidenceScorer.Score(
            CreateCriteria(),
            CreateCandidate(
                club: "Barcelona",
                dateOfBirth: DateOfBirth));

        Assert.Contains("Current club match", result.Reasons);
    }

    private static int ComputeAge(DateOnly dateOfBirth)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var age = today.Year - dateOfBirth.Year;
        if (dateOfBirth.AddYears(age) > today)
        {
            age--;
        }

        return age;
    }
}
