using GlobalScout.Application.Auth;
using GlobalScout.Application.Auth.GetProfile;
using GlobalScout.Application.Auth.Login;
using GlobalScout.Application.Auth.Register;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Abstractions.Auth;

public interface IUserIdentityStore
{
    Task<Result<RegisterUserOutcome>> RegisterAsync(RegisterUserCommand command, CancellationToken cancellationToken);

    Task<Result<LoginUserOutcome>> ValidateLoginAsync(LoginUserCommand command, CancellationToken cancellationToken);

    Task<Result<GetAuthProfileResult?>> GetProfileAsync(Guid userId, CancellationToken cancellationToken);
}
