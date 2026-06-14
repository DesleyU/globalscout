using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Application.Admin.UpdateUserStatus;
using GlobalScout.Application.Authorization;
using GlobalScout.SharedKernel;

namespace GlobalScout.Api.Endpoints.Admin;

internal sealed class PutAdminUserStatus : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPut(
                AdminRoutes.UserStatus,
                async (
                    ClaimsPrincipal principal,
                    Guid userId,
                    UpdateUserStatusRequest body,
                    ICommandHandler<UpdateAdminUserStatusCommand, AdminUserStatusSummary> handler,
                    CancellationToken cancellationToken) =>
                {
                    var adminId = HttpUser.ResolveId(principal);
                    if (adminId is null)
                    {
                        return Results.Unauthorized();
                    }

                    var command = new UpdateAdminUserStatusCommand(userId, adminId.Value, body.Status);
                    var result = await handler.Handle(command, cancellationToken);
                    return result.Match(
                        summary => Results.Ok(new
                        {
                            message = $"User status updated to {summary.Status}",
                            user = new
                            {
                                id = summary.Id,
                                email = summary.Email,
                                role = summary.Role,
                                status = summary.Status,
                                profile = summary.Profile
                            }
                        }),
                        CustomResults.Problem);
                })
            .RequireAuthorization(AuthorizationPolicyNames.Admin)
            .WithName("AdminUpdateUserStatus")
            .WithTags(AdminEndpointTags.Admin);
    }

    private sealed record UpdateUserStatusRequest(string Status);
}
