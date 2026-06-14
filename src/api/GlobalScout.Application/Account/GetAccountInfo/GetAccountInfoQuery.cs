using GlobalScout.Application.Abstractions.Messaging;

namespace GlobalScout.Application.Account.GetAccountInfo;

public sealed record GetAccountInfoQuery(Guid UserId) : IQuery<GetAccountInfoResult>;
