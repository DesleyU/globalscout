using GlobalScout.Application.Abstractions.Billing;
using GlobalScout.Application.Abstractions.Messaging;

namespace GlobalScout.Application.Billing.CreateCheckoutSession;

public sealed record CreateCheckoutSessionCommand(Guid UserId) : ICommand<CreateCheckoutSessionResult>;
