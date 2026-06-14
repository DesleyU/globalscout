using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Users;

namespace GlobalScout.Application.Users.Visitors;

public sealed record GetProfileVisitorsQuery(Guid ProfileOwnerId) : IQuery<GetProfileVisitorsResult>;
