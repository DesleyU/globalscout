using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Abstractions.Dev;

public sealed record TestUserCreationSpec(
    string Email,
    string Password,
    string RoleName,
    string FirstName,
    string LastName,
    int? Age,
    string? Position,
    string? Nationality,
    string? Country,
    string? City,
    string? ClubName);

public sealed record CreatedTestUser(Guid Id, string Email);

public interface ITestUserFactory
{
    Task<Result<CreatedTestUser>> CreateAsync(TestUserCreationSpec spec, CancellationToken cancellationToken);
}
