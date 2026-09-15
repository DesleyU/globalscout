using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Auth.ResendVerificationEmail;
using GlobalScout.SharedKernel;

namespace GlobalScout.Api.Endpoints.Auth;

internal sealed class PostAuthResendVerification : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost(
                AuthRoutes.ResendVerification,
                async (
                    ClaimsPrincipal user,
                    ICommandHandler<ResendVerificationEmailCommand, ResendVerificationEmailResult> handler,
                    CancellationToken cancellationToken) =>
                {
                    var userId = HttpUser.ResolveId(user);
                    if (userId is null)
                    {
                        return Results.Unauthorized();
                    }

                    var result = await handler.Handle(new ResendVerificationEmailCommand(userId.Value), cancellationToken);

                    return result.Match(
                        _ => Results.Ok(new { message = "Verification email sent" }),
                        CustomResults.Problem);
                })
            .RequireAuthorization()
            .WithName("ResendVerification")
            .WithTags(AuthEndpointTags.Authentication);
    }
}
