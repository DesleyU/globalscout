using GlobalScout.Application.Auth.Register;
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
            FirstName: "Test",
            LastName: "User");

        var result = _validator.Validate(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(RegisterUserCommand.Email));
    }

    [Fact]
    public void Validate_valid_account_succeeds()
    {
        var command = new RegisterUserCommand(
            Email: "user@example.com",
            Password: "secret12",
            FirstName: "Test",
            LastName: "User");

        var result = _validator.Validate(command);

        Assert.True(result.IsValid);
    }
}
