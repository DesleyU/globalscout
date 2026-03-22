using GlobalScout.Domain.Identity;

namespace GlobalScout.Application.Users.Queries.GetUserById;

public sealed record GetUserByIdResult(Guid Id, string Email, UserRole Role, UserStatus Status, AccountType AccountType);
