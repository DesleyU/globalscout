using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Auth.VerifyEmail;
using GlobalScout.SharedKernel;
using Microsoft.AspNetCore.Mvc;

namespace GlobalScout.Api.Endpoints.Auth;

internal sealed class PostAuthVerifyEmail : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost(
                AuthRoutes.VerifyEmail,
                async (
                    [FromBody] VerifyEmailCommand command,
                    ICommandHandler<VerifyEmailCommand, VerifyEmailResult> handler,
                    CancellationToken cancellationToken) =>
                {
                    var result = await handler.Handle(command, cancellationToken);

                    return result.Match(
                        r => Results.Ok(new
                        {
                            message = r.AlreadyVerified
                                ? "Your email is already verified"
                                : "Email verified successfully",
                            alreadyVerified = r.AlreadyVerified
                        }),
                        CustomResults.Problem);
                })
            .AllowAnonymous()
            .WithName("VerifyEmail")
            .WithTags(AuthEndpointTags.Authentication);
    }
}
