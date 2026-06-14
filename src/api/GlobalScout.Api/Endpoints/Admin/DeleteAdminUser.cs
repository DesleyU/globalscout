using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Admin.DeleteUser;
using GlobalScout.Application.Authorization;
using GlobalScout.SharedKernel;

namespace GlobalScout.Api.Endpoints.Admin;

internal sealed class DeleteAdminUser : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapDelete(
                AdminRoutes.UserById,
                async (
                    ClaimsPrincipal principal,
                    Guid userId,
                    ICommandHandler<DeleteAdminUserCommand, DeleteAdminUserResult> handler,
                    CancellationToken cancellationToken) =>
                {
                    var adminId = HttpUser.ResolveId(principal);
                    if (adminId is null)
                    {
                        return Results.Unauthorized();
                    }

                    var command = new DeleteAdminUserCommand(userId, adminId.Value);
                    var result = await handler.Handle(command, cancellationToken);
                    return result.Match(
                        r => Results.Ok(new { message = r.Message }),
                        CustomResults.Problem);
                })
            .RequireAuthorization(AuthorizationPolicyNames.Admin)
            .WithName("AdminDeleteUser")
            .WithTags(AdminEndpointTags.Admin);
    }
}
