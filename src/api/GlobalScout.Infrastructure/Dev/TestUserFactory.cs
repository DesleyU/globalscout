using GlobalScout.Application.Abstractions.Dev;
using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Infrastructure.Identity;
using GlobalScout.SharedKernel;

namespace GlobalScout.Infrastructure.Dev;

/// <summary>
/// Dev-only: creates a fully functional test user the same way real registration does
/// (<see cref="ApplicationUserCreator"/>), except pre-confirmed and with a fake profile filled in.
/// </summary>
internal sealed class TestUserFactory(
    ApplicationUserCreator userCreator,
    IUserDirectoryRepository users) : ITestUserFactory
{
    public async Task<Result<CreatedTestUser>> CreateAsync(TestUserCreationSpec spec, CancellationToken cancellationToken)
    {
        var created = await userCreator.CreateAsync(
            email: spec.Email,
            emailConfirmed: true,
            password: spec.Password,
            roleName: spec.RoleName,
            firstName: spec.FirstName,
            lastName: spec.LastName,
            age: spec.Age,
            cancellationToken);

        if (created.IsFailure)
        {
            return Result.Failure<CreatedTestUser>(created.Error);
        }

        var patch = new ProfileFieldPatch
        {
            Position = spec.Position,
            Nationality = spec.Nationality,
            Country = spec.Country,
            City = spec.City,
            ClubName = spec.ClubName,
        };

        if (patch.HasAny)
        {
            await users.UpdateProfileFieldsAsync(created.Value.Id, patch, cancellationToken);
        }

        return Result.Success(new CreatedTestUser(created.Value.Id, created.Value.Email!));
    }
}
