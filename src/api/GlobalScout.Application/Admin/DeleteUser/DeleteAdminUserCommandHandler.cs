using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.SharedKernel;

using static GlobalScout.Application.Admin.AdminErrors;

namespace GlobalScout.Application.Admin.DeleteUser;

internal sealed class DeleteAdminUserCommandHandler(IAdminRepository admin)
    : ICommandHandler<DeleteAdminUserCommand, DeleteAdminUserResult>
{
    public async Task<Result<DeleteAdminUserResult>> Handle(
        DeleteAdminUserCommand command,
        CancellationToken cancellationToken)
    {
        if (command.TargetUserId == command.ActingAdminId)
        {
            return Result.Failure<DeleteAdminUserResult>(CannotDeleteSelf());
        }

        var result = await admin.DeleteUserAsync(command.TargetUserId, cancellationToken);
        if (result.IsFailure)
        {
            return Result.Failure<DeleteAdminUserResult>(result.Error);
        }

        return Result.Success(new DeleteAdminUserResult("User deleted successfully"));
    }
}
