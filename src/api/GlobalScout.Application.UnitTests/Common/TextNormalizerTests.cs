using GlobalScout.Application.Common;
using Xunit;

namespace GlobalScout.Application.UnitTests.Common;

public sealed class TextNormalizerTests
{
    [Theory]
    [InlineData("Târnovanu", "Tarnovanu")]
    [InlineData("Ștefan", "Stefan")]
    [InlineData("Müller", "Muller")]
    [InlineData("José", "Jose")]
    [InlineData("Łukasz", "Lukasz")]
    [InlineData("Straße", "Strasse")]
    public void RemoveDiacritics_strips_accents(string input, string expected) =>
        Assert.Equal(expected, TextNormalizer.RemoveDiacritics(input));

    [Theory]
    [InlineData("  Știința București  ", "stiinta bucuresti")]
    [InlineData("MÜNCHEN", "munchen")]
    [InlineData("Straße", "strasse")]
    public void ToSearchKey_trims_removes_diacritics_and_lowercases(string input, string expected) =>
        Assert.Equal(expected, TextNormalizer.ToSearchKey(input));

    [Theory]
    [InlineData("Târnovanu", "Tarnovanu")]
    [InlineData("O'Brien", "OBrien")]
    [InlineData("Saint-Germain", "SaintGermain")]
    [InlineData("  FC  Argeș  ", "FC Arges")]
    public void ToApiFootballSearchTerm_keeps_only_ascii_alphanumeric_and_spaces(string input, string expected) =>
        Assert.Equal(expected, TextNormalizer.ToApiFootballSearchTerm(input));

    [Fact]
    public void ToApiFootballSearchTerm_returns_empty_for_whitespace() =>
        Assert.Equal(string.Empty, TextNormalizer.ToApiFootballSearchTerm("   "));
}
