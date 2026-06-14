using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Account.SetRole;
using GlobalScout.SharedKernel;
using Microsoft.AspNetCore.Mvc;

namespace GlobalScout.Api.Endpoints.Account;

internal sealed class PostAccountSetRole : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost(
                AccountRoutes.Role,
                async (
                    ClaimsPrincipal user,
                    [FromBody] SetAccountRoleRequest body,
                    ICommandHandler<SetUserRoleCommand, SetUserRoleResult> handler,
                    CancellationToken cancellationToken) =>
                {
                    var userId = HttpUser.ResolveId(user);
                    if (userId is null)
                    {
                        return Results.Unauthorized();
                    }

                    var result = await handler.Handle(
                        new SetUserRoleCommand(userId.Value, body.Role),
                        cancellationToken);

                    return result.Match(
                        r => Results.Ok(new
                        {
                            token = r.Token,
                            user = new
                            {
                                id = r.UserId,
                                email = r.Email,
                                role = r.Role,
                                profile = r.Profile
                            }
                        }),
                        CustomResults.Problem);
                })
            .RequireAuthorization()
            .WithName("PostAccountSetRole")
            .WithTags(AccountEndpointTags.Account);
    }

    internal sealed record SetAccountRoleRequest(string Role);
}
