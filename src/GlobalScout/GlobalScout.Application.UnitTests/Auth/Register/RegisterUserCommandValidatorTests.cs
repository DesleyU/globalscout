using GlobalScout.Application.Auth.Register;
using GlobalScout.Domain.Identity;
using Xunit;

namespace GlobalScout.Application.UnitTests.Auth.Register;

public sealed class RegisterUserCommandValidatorTests
{
    private readonly RegisterUserCommandValidator _validator = new();

    [Fact]
    public void Validate_invalid_email_fails()
    {
        var command = new RegisterUserCommand(
            Email: "not-an-email",
            Password: "secret12",
            Role: AppRoleNames.Club,
            FirstName: "Test",
            LastName: "User",
            Position: null,
            Age: null,
            ClubName: "Test FC");

        var result = _validator.Validate(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(RegisterUserCommand.Email));
    }

    [Fact]
    public void Validate_club_without_club_name_fails()
    {
        var command = new RegisterUserCommand(
            Email: "club@example.com",
            Password: "secret12",
            Role: AppRoleNames.Club,
            FirstName: "Test",
            LastName: "User",
            Position: null,
            Age: null,
            ClubName: null);

        var result = _validator.Validate(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(RegisterUserCommand.ClubName));
    }
}
