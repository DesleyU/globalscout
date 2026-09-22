using GlobalScout.Application.Abstractions.Dev;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Dev.SeedTestUsers;

internal sealed class SeedTestUsersCommandHandler(ITestUserFactory factory)
    : ICommandHandler<SeedTestUsersCommand, SeedTestUsersResult>
{
    public async Task<Result<SeedTestUsersResult>> Handle(SeedTestUsersCommand command, CancellationToken cancellationToken)
    {
        var random = new Random();
        var created = new List<SeededTestUser>();

        for (var i = 0; i < command.Count; i++)
        {
            var spec = TestUserDataGenerator.Generate(command.Role, random);
            var result = await factory.CreateAsync(spec, cancellationToken);

            if (result.IsFailure)
            {
                return Result.Failure<SeedTestUsersResult>(result.Error);
            }

            created.Add(new SeededTestUser(
                result.Value.Id,
                result.Value.Email,
                spec.Password,
                command.Role,
                spec.FirstName,
                spec.LastName));
        }

        return Result.Success(new SeedTestUsersResult(created));
    }
}
