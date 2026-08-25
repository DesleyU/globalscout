using GlobalScout.Application.PlayerIdentity.Matching;
using Xunit;

namespace GlobalScout.Application.UnitTests.PlayerIdentity;

public sealed class NameMatcherTests
{
    [Fact]
    public void LastNamesMatch_ignores_diacritics() =>
        Assert.True(NameMatcher.LastNamesMatch("Târnovanu", "Tarnovanu"));

    [Fact]
    public void FirstNamesMatch_allows_api_middle_name() =>
        Assert.True(NameMatcher.FirstNamesMatch("Ianis", "Ianis Florin"));

    [Fact]
    public void LastNamesMatch_allows_api_middle_name_before_surname() =>
        Assert.True(NameMatcher.LastNamesMatch("Tarnovanu", "Ionut Tarnovanu"));

    [Fact]
    public void LastNamesMatch_allows_one_character_typo() =>
        Assert.True(NameMatcher.LastNamesMatch("Gonzalez", "Gonzales"));

    [Fact]
    public void FirstNamesMatch_allows_initial() =>
        Assert.True(NameMatcher.FirstNamesMatch("J.", "John"));

    [Fact]
    public void FirstNamesMatch_rejects_different_names() =>
        Assert.False(NameMatcher.FirstNamesMatch("Ianis", "Ioan"));

    [Fact]
    public void LastNamesMatch_rejects_similar_short_names() =>
        Assert.False(NameMatcher.LastNamesMatch("Hagi", "Magi"));
}
