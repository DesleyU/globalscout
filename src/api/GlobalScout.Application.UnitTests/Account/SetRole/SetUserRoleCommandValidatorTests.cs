using GlobalScout.Application.Account.SetRole;
using GlobalScout.Domain.Identity;
using Xunit;

namespace GlobalScout.Application.UnitTests.Account.SetRole;

public sealed class SetUserRoleCommandValidatorTests
{
    private readonly SetUserRoleCommandValidator _validator = new();

    [Theory]
    [InlineData(AppRoleNames.Player)]
    [InlineData(AppRoleNames.Club)]
    [InlineData(AppRoleNames.ScoutAgent)]
    public void Validate_allowed_target_role_succeeds(string role)
    {
        var command = new SetUserRoleCommand(Guid.NewGuid(), role);

        var result = _validator.Validate(command);

        Assert.True(result.IsValid);
    }

    [Theory]
    [InlineData(AppRoleNames.Pending)]
    [InlineData(AppRoleNames.Admin)]
    [InlineData("INVALID")]
    public void Validate_disallowed_target_role_fails(string role)
    {
        var command = new SetUserRoleCommand(Guid.NewGuid(), role);

        var result = _validator.Validate(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(SetUserRoleCommand.NewRole));
    }
}
