using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Domain.Identity;
using GlobalScout.SharedKernel;

using static GlobalScout.Application.Admin.AdminErrors;

namespace GlobalScout.Application.Admin.UpdateUserStatus;

internal sealed class UpdateAdminUserStatusCommandHandler(IAdminRepository admin)
    : ICommandHandler<UpdateAdminUserStatusCommand, AdminUserStatusSummary>
{
    public async Task<Result<AdminUserStatusSummary>> Handle(
        UpdateAdminUserStatusCommand command,
        CancellationToken cancellationToken)
    {
        if (!AdminUserStatusParser.TryParse(command.Status, out var newStatus))
        {
            return Result.Failure<AdminUserStatusSummary>(InvalidStatus());
        }

        if (command.TargetUserId == command.ActingAdminId && newStatus == UserStatus.Blocked)
        {
            return Result.Failure<AdminUserStatusSummary>(CannotBlockSelf());
        }

        return await admin.UpdateUserStatusAsync(command.TargetUserId, newStatus, cancellationToken);
    }
}
