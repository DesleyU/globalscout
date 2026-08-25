using GlobalScout.Application.ReferenceData;
using Xunit;

namespace GlobalScout.Application.UnitTests.ReferenceData;

public sealed class FootballCountriesTests
{
    [Fact]
    public void GetAll_returns_unique_code_backed_countries()
    {
        var countries = FootballCountries.GetAll();

        Assert.Equal(169, countries.Count);
        Assert.DoesNotContain(countries, country => string.IsNullOrWhiteSpace(country.Code));
        Assert.Equal(
            countries.Count,
            countries.Select(country => country.Code).Distinct(StringComparer.OrdinalIgnoreCase).Count());
    }

    [Fact]
    public void GetAll_returns_friendly_names_and_derived_flag_urls()
    {
        var czechRepublic = Assert.Single(
            FootballCountries.GetAll(),
            country => country.Code == "CZ");

        Assert.Equal("Czech Republic", czechRepublic.Name);
        Assert.Equal("https://media.api-sports.io/flags/cz.svg", czechRepublic.FlagUrl);
    }

    [Fact]
    public void FindByCode_preserves_the_provider_name()
    {
        var country = FootballCountries.FindByCode("cz");

        Assert.NotNull(country);
        Assert.Equal("Czech Republic", country.Name);
        Assert.Equal("Czech-Republic", country.ProviderName);
    }

    [Theory]
    [InlineData("Czech Republic")]
    [InlineData("Czech-Republic")]
    [InlineData("czech republic")]
    public void FindByName_accepts_display_and_provider_names(string value)
    {
        var country = FootballCountries.FindByName(value);

        Assert.NotNull(country);
        Assert.Equal("CZ", country.Code);
    }
}
