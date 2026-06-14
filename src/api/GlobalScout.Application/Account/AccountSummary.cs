using GlobalScout.Domain.Identity;

namespace GlobalScout.Application.Account;

public sealed record AccountSummary(Guid Id, string Email, AccountType AccountType, DateTimeOffset CreatedAt);
