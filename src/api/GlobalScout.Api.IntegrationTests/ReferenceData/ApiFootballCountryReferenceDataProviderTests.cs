using System.Net;
using System.Text;
using GlobalScout.Application.Abstractions.Statistics;
using GlobalScout.Infrastructure.ReferenceData;
using Microsoft.Extensions.Options;

namespace GlobalScout.Api.IntegrationTests.ReferenceData;

public sealed class ApiFootballCountryReferenceDataProviderTests
{
    [Fact]
    public async Task GetLeaguesAsync_follows_every_page()
    {
        var handler = new QueueHttpMessageHandler(
            LeaguePage(page: 1, totalPages: 2, id: 301, name: "First League"),
            LeaguePage(page: 2, totalPages: 2, id: 402, name: "Second League"));
        using var http = new HttpClient(handler)
        {
            BaseAddress = new Uri("https://provider.test/")
        };
        var provider = new ApiFootballCountryReferenceDataProvider(
            http,
            Options.Create(new ApiFootballOptions { ApiKey = "test-key" }));

        var result = await provider.GetLeaguesAsync(
            "Romania",
            TestContext.Current.CancellationToken);

        Assert.True(result.IsSuccess);
        Assert.Equal([301, 402], result.Value.Select(competition => competition.ExternalCompetitionId));
        Assert.Equal(2, handler.RequestUris.Count);
        Assert.Equal("?country=Romania", handler.RequestUris[0].Query);
        Assert.Contains("country=Romania&page=2", handler.RequestUris[1].Query);
    }

    [Fact]
    public async Task GetTeamsAsync_handles_null_founded_year()
    {
        var handler = new QueueHttpMessageHandler(
            """
            {
              "errors": [],
              "paging": { "current": 1, "total": 1 },
              "response": [
                {
                  "team": {
                    "id": 2579,
                    "name": "AFC Hermannstadt",
                    "code": null,
                    "country": "Romania",
                    "founded": null,
                    "national": false,
                    "logo": "https://example.test/2579.png"
                  }
                }
              ]
            }
            """);
        using var http = new HttpClient(handler)
        {
            BaseAddress = new Uri("https://provider.test/")
        };
        var provider = new ApiFootballCountryReferenceDataProvider(
            http,
            Options.Create(new ApiFootballOptions { ApiKey = "test-key" }));

        var result = await provider.GetTeamsAsync(
            "Romania",
            TestContext.Current.CancellationToken);

        Assert.True(result.IsSuccess);
        Assert.Single(result.Value);
        Assert.Equal(2579, result.Value[0].ExternalTeamId);
        Assert.Null(result.Value[0].Founded);
    }

    [Fact]
    public async Task GetTeamsAsync_follows_every_page()
    {
        var handler = new QueueHttpMessageHandler(
            TeamPage(page: 1, totalPages: 2, id: 101, name: "First FC"),
            TeamPage(page: 2, totalPages: 2, id: 202, name: "Second FC"));
        using var http = new HttpClient(handler)
        {
            BaseAddress = new Uri("https://provider.test/")
        };
        var provider = new ApiFootballCountryReferenceDataProvider(
            http,
            Options.Create(new ApiFootballOptions { ApiKey = "test-key" }));

        var result = await provider.GetTeamsAsync(
            "Czech-Republic",
            TestContext.Current.CancellationToken);

        Assert.True(result.IsSuccess);
        Assert.Equal([101, 202], result.Value.Select(team => team.ExternalTeamId));
        Assert.Equal(2, handler.RequestUris.Count);
        Assert.Equal("?country=Czech-Republic", handler.RequestUris[0].Query);
        Assert.Contains("country=Czech-Republic&page=2", handler.RequestUris[1].Query);
    }

    private static string LeaguePage(int page, int totalPages, int id, string name) =>
        $$"""
        {
          "errors": [],
          "paging": { "current": {{page}}, "total": {{totalPages}} },
          "response": [
            {
              "league": {
                "id": {{id}},
                "name": "{{name}}",
                "type": "League",
                "logo": "https://example.test/league-{{id}}.png"
              }
            }
          ]
        }
        """;

    private static string TeamPage(int page, int totalPages, int id, string name) =>
        $$"""
        {
          "errors": [],
          "paging": { "current": {{page}}, "total": {{totalPages}} },
          "response": [
            {
              "team": {
                "id": {{id}},
                "name": "{{name}}",
                "code": "TST",
                "founded": 2000,
                "national": false,
                "logo": "https://example.test/{{id}}.png"
              }
            }
          ]
        }
        """;

    private sealed class QueueHttpMessageHandler(params string[] responses) : HttpMessageHandler
    {
        private readonly Queue<string> _responses = new(responses);

        public List<Uri> RequestUris { get; } = [];

        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            RequestUris.Add(request.RequestUri!);
            var response = new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(_responses.Dequeue(), Encoding.UTF8, "application/json")
            };
            return Task.FromResult(response);
        }
    }
}
