using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.Persistence;

namespace GlobalScout.Application.Admin.GetSystemStats;

public sealed record GetAdminSystemStatsQuery : IQuery<AdminSystemStatsResult>;
