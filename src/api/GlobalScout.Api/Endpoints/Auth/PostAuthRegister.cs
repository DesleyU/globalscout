using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Auth.Register;
using GlobalScout.SharedKernel;
using Microsoft.AspNetCore.Mvc;

namespace GlobalScout.Api.Endpoints.Auth;

internal sealed class PostAuthRegister : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost(
                AuthRoutes.Register,
                async (
                    [FromBody] RegisterUserCommand command,
                    ICommandHandler<RegisterUserCommand, RegisterUserResult> handler,
                    CancellationToken cancellationToken) =>
                {
                    var result = await handler.Handle(command, cancellationToken);

                    return result.Match(
                        r => Results.Created(
                            $"/api/users/{r.UserId}",
                            new
                            {
                                message = "User registered successfully",
                                token = r.Token,
                                user = new { id = r.UserId, email = r.Email, role = r.Role, profile = r.Profile }
                            }),
                        CustomResults.Problem);
                })
            .AllowAnonymous()
            .WithName("Register")
            .WithTags(AuthEndpointTags.Authentication);
    }
}
