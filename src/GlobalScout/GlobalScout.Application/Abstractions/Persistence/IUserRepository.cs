using GlobalScout.Domain.Identity;

namespace GlobalScout.Application.Abstractions.Persistence;

public interface IUserRepository
{
    Task<UserSummary?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
}

public sealed record UserSummary(Guid Id, string Email, UserRole Role, UserStatus Status, AccountType AccountType);
