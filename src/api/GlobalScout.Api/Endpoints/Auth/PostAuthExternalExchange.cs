using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Auth.ExternalLogin;
using Microsoft.AspNetCore.Mvc;

namespace GlobalScout.Api.Endpoints.Auth;

/// <summary>
/// Called server-to-server by the Next.js BFF (<c>app/api/auth/external/complete/route.ts</c>), mirroring
/// how that BFF's sign-in route calls <c>PostAuthLogin</c> today. See contracts/api-auth-external.md.
/// </summary>
internal sealed class PostAuthExternalExchange : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost(
                AuthRoutes.ExternalExchange,
                async (
                    [FromBody] ExchangeHandoffCodeRequest request,
                    ICommandHandler<ExchangeHandoffCodeCommand, ExchangeHandoffCodeResult> handler,
                    CancellationToken cancellationToken) =>
                {
                    var result = await handler.Handle(new ExchangeHandoffCodeCommand(request.Code), cancellationToken);

                    return result.Match(
                        r => Results.Ok(new
                        {
                            token = r.Token,
                            user = new { id = r.UserId, email = r.Email, role = r.Role, profile = r.Profile }
                        }),
                        CustomResults.Problem);
                })
            .AllowAnonymous()
            .WithName("PostAuthExternalExchange")
            .WithTags(AuthEndpointTags.Authentication);
    }
}

internal sealed record ExchangeHandoffCodeRequest(string Code);
