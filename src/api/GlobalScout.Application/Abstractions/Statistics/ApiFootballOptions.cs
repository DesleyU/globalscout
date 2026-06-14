namespace GlobalScout.Application.Abstractions.Statistics;

public sealed class ApiFootballOptions
{
    public const string SectionName = "ApiFootball";

    public string ApiKey { get; set; } = string.Empty;

    public string Host { get; set; } = "v3.football.api-sports.io";

    public string BaseUrl { get; set; } = "https://v3.football.api-sports.io";
}
