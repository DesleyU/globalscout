using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Social;

namespace GlobalScout.Application.Social.GetConnections;

public sealed record GetConnectionsQuery(Guid UserId, string? Status, int Page, int Limit) : IQuery<GetConnectionsResult>;
