using GlobalScout.Application.Abstractions.Billing;
using GlobalScout.Application.Abstractions.Messaging;

namespace GlobalScout.Application.Billing.CreatePortalSession;

public sealed record CreateBillingPortalSessionCommand(Guid UserId) : ICommand<CreateBillingPortalSessionResult>;
