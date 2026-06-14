using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Social;

namespace GlobalScout.Application.Social.Connections.GetPendingRequests;

public sealed record GetPendingConnectionRequestsQuery(Guid UserId, string? Type, int Page, int Limit)
    : IQuery<GetPendingConnectionRequestsResult>;
