using System.Text.Json;
using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Application.Statistics;
using Xunit;

namespace GlobalScout.Application.UnitTests.Statistics;

public sealed class PlayerStatisticsMapperTests
{
    [Fact]
    public void ToBasicMaskedDictionary_excludes_extended_metrics()
    {
        using JsonDocument doc = JsonDocument.Parse(
            """{"kind":"manual","season":"2024","goals":1,"shotsTotal":99,"passesTotal":50}""");
        var row = new PlayerStatisticsListItemDto(
            Guid.NewGuid(),
            "2024",
            "manual",
            "1",
            doc.RootElement.Clone());

        IReadOnlyDictionary<string, object?> masked = PlayerStatisticsMapper.ToBasicMaskedDictionary(row);
        Assert.False(masked.ContainsKey("shotsTotal"));
        Assert.False(masked.ContainsKey("passesTotal"));
        Assert.Equal(1, masked["goals"]);
    }

    [Fact]
    public void ToFullDictionary_includes_extended_metrics_and_data()
    {
        using JsonDocument doc = JsonDocument.Parse(
            """{"kind":"manual","season":"2024","goals":1,"shotsTotal":99}""");
        var row = new PlayerStatisticsListItemDto(
            Guid.NewGuid(),
            "2024",
            "manual",
            "1",
            doc.RootElement.Clone());

        Dictionary<string, object?> full = PlayerStatisticsMapper.ToFullDictionary(row);
        Assert.Equal(99, full["shotsTotal"]);
        Assert.True(full.ContainsKey("data"));
    }
}
