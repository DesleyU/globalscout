using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Auth.Login;
using GlobalScout.SharedKernel;
using Microsoft.AspNetCore.Mvc;

namespace GlobalScout.Api.Endpoints.Auth;

internal sealed class PostAuthLogin : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost(
                AuthRoutes.Login,
                async (
                    [FromBody] LoginUserCommand command,
                    ICommandHandler<LoginUserCommand, LoginUserResult> handler,
                    CancellationToken cancellationToken) =>
                {
                    var result = await handler.Handle(command, cancellationToken);

                    return result.Match(
                        r => Results.Ok(new
                        {
                            message = "Login successful",
                            token = r.Token,
                            user = new
                            {
                                id = r.UserId,
                                email = r.Email,
                                role = r.Role,
                                accountType = r.AccountType,
                                profile = r.Profile
                            }
                        }),
                        CustomResults.Problem);
                })
            .AllowAnonymous()
            .WithName("Login")
            .WithTags(AuthEndpointTags.Authentication);
    }
}
