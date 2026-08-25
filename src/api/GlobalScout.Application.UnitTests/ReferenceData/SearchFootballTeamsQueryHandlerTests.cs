using GlobalScout.Application.Abstractions.ReferenceData;
using GlobalScout.Application.ReferenceData;
using GlobalScout.Application.ReferenceData.SearchTeams;
using GlobalScout.SharedKernel;
using Moq;
using Xunit;

namespace GlobalScout.Application.UnitTests.ReferenceData;

public sealed class SearchFootballTeamsQueryHandlerTests
{
    [Fact]
    public async Task Handle_returns_catalog_results_without_calling_provider()
    {
        var team = CatalogTeam(Guid.NewGuid(), 559, "FCSB");
        var catalog = new Mock<IReferenceDataCatalog>();
        catalog
            .Setup(instance => instance.SearchTeamsAsync(
                "RO",
                "fcs",
                false,
                25,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([team]);
        var external = new Mock<IExternalTeamSearch>();
        var handler = new SearchFootballTeamsQueryHandler(catalog.Object, external.Object);

        var result = await handler.Handle(
            new SearchFootballTeamsQuery("Romania", "fcs"),
            CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(team, Assert.Single(result.Value.Teams));
        external.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Handle_forwards_external_id_requirement_to_the_catalog()
    {
        var team = CatalogTeam(Guid.NewGuid(), 559, "FCSB");
        var catalog = new Mock<IReferenceDataCatalog>();
        catalog
            .Setup(instance => instance.SearchTeamsAsync(
                "RO",
                "fcs",
                true,
                25,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([team]);
        var external = new Mock<IExternalTeamSearch>();
        var handler = new SearchFootballTeamsQueryHandler(catalog.Object, external.Object);

        var result = await handler.Handle(
            new SearchFootballTeamsQuery("Romania", "fcs", RequiresExternalId: true),
            CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(team, Assert.Single(result.Value.Teams));
        catalog.VerifyAll();
        external.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Handle_returns_empty_for_two_character_catalog_miss_without_calling_provider()
    {
        var catalog = CatalogReturningNoResults();
        var external = new Mock<IExternalTeamSearch>();
        var handler = new SearchFootballTeamsQueryHandler(catalog.Object, external.Object);

        var result = await handler.Handle(
            new SearchFootballTeamsQuery("Romania", "fc"),
            CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Empty(result.Value.Teams);
        external.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Handle_upserts_provider_results_and_returns_real_catalog_ids_on_miss()
    {
        var catalogId = Guid.NewGuid();
        var externalTeam = new ExternalFootballTeam(123, "Test FC", "TST", null, false, null);
        var persistedTeam = CatalogTeam(catalogId, 123, "Test FC", "Albania");
        var catalog = CatalogReturningNoResults();
        catalog
            .Setup(instance => instance.UpsertProviderTeamsAsync(
                "AL",
                It.Is<IReadOnlyList<ExternalFootballTeam>>(teams =>
                    teams.Count == 1 && teams[0] == externalTeam),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ProviderUpsertResult<FootballTeamDto>([persistedTeam], 1, 0));
        var external = new Mock<IExternalTeamSearch>();
        external
            .Setup(instance => instance.SearchAsync(
                "Albania",
                "test",
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Success<IReadOnlyList<ExternalFootballTeam>>([externalTeam]));
        var handler = new SearchFootballTeamsQueryHandler(catalog.Object, external.Object);

        var result = await handler.Handle(
            new SearchFootballTeamsQuery("Albania", "test"),
            CancellationToken.None);

        Assert.True(result.IsSuccess);
        var resultTeam = Assert.Single(result.Value.Teams);
        Assert.Equal(catalogId, resultTeam.Id);
        Assert.NotEqual(Guid.Empty, resultTeam.Id);
    }

    [Fact]
    public async Task Handle_uses_provider_name_when_display_name_differs()
    {
        var catalog = CatalogReturningNoResults();
        catalog
            .Setup(instance => instance.UpsertProviderTeamsAsync(
                "CZ",
                It.IsAny<IReadOnlyList<ExternalFootballTeam>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ProviderUpsertResult<FootballTeamDto>([], 0, 0));
        var external = new Mock<IExternalTeamSearch>();
        external
            .Setup(instance => instance.SearchAsync(
                "Czech-Republic",
                "praha",
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Success<IReadOnlyList<ExternalFootballTeam>>([]));
        var handler = new SearchFootballTeamsQueryHandler(catalog.Object, external.Object);

        var result = await handler.Handle(
            new SearchFootballTeamsQuery("Czech Republic", "praha"),
            CancellationToken.None);

        Assert.True(result.IsSuccess);
        external.VerifyAll();
    }

    [Fact]
    public async Task Handle_rejects_an_unknown_country_without_querying_dependencies()
    {
        var catalog = new Mock<IReferenceDataCatalog>();
        var external = new Mock<IExternalTeamSearch>();
        var handler = new SearchFootballTeamsQueryHandler(catalog.Object, external.Object);

        var result = await handler.Handle(
            new SearchFootballTeamsQuery("Not-A-Country", "test"),
            CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal(ReferenceDataErrors.CountryNotSupported, result.Error);
        catalog.VerifyNoOtherCalls();
        external.VerifyNoOtherCalls();
    }

    private static Mock<IReferenceDataCatalog> CatalogReturningNoResults()
    {
        var catalog = new Mock<IReferenceDataCatalog>();
        catalog
            .Setup(instance => instance.SearchTeamsAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<bool>(),
                It.IsAny<int>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
        return catalog;
    }

    private static FootballTeamDto CatalogTeam(
        Guid id,
        int externalId,
        string name,
        string country = "Romania") =>
        new(id, externalId, name, null, country, null, false, null, true);
}
