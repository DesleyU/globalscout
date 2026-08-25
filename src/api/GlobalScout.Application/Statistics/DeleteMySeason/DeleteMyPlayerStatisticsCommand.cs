using GlobalScout.Application.Abstractions.Messaging;

namespace GlobalScout.Application.Statistics.DeleteMySeason;

public sealed record DeleteMyPlayerStatisticsCommand(Guid UserId, string Season)
    : ICommand<DeleteMyPlayerStatisticsResult>;

public sealed record DeleteMyPlayerStatisticsResult(string Message);
