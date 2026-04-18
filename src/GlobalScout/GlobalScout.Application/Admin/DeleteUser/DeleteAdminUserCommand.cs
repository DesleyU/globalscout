using GlobalScout.Application.Abstractions.Messaging;

namespace GlobalScout.Application.Admin.DeleteUser;

public sealed record DeleteAdminUserCommand(Guid TargetUserId, Guid ActingAdminId) : ICommand<DeleteAdminUserResult>;

public sealed record DeleteAdminUserResult(string Message);
