using System.Text.Json;
using System.Text.Json.Serialization;

namespace GlobalScout.Application.Statistics;

public sealed record PlayerStatisticsListItemDto(
    Guid Id,
    string Season,
    string Source,
    string SchemaVersion,
    JsonElement? Data);
