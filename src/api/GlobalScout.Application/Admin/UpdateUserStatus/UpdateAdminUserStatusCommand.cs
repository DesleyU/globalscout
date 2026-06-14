using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.Persistence;

namespace GlobalScout.Application.Admin.UpdateUserStatus;

public sealed record UpdateAdminUserStatusCommand(Guid TargetUserId, Guid ActingAdminId, string Status)
    : ICommand<AdminUserStatusSummary>;
