using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Social;
using GlobalScout.Application.Social.Connections.RespondConnection;
using GlobalScout.SharedKernel;

namespace GlobalScout.Api.Endpoints.Social.Connections;

internal sealed class PutConnectionsRespond : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPut(
                ConnectionsRoutes.Respond,
                async (
                    ClaimsPrincipal user,
                    Guid connectionId,
                    RespondBody body,
                    ICommandHandler<RespondToConnectionCommand, RespondToConnectionResponseDto> handler,
                    CancellationToken cancellationToken) =>
                {
                    var receiverId = HttpUser.ResolveId(user);
                    if (receiverId is null)
                    {
                        return Results.Unauthorized();
                    }

                    var command = new RespondToConnectionCommand
                    {
                        ReceiverId = receiverId.Value,
                        ConnectionId = connectionId,
                        Action = body.Action
                    };

                    var result = await handler.Handle(command, cancellationToken);

                    return result.Match(
                        ok => Results.Ok(
                            new
                            {
                                message = $"Connection {PastTense(body.Action)} successfully",
                                connection = ok
                            }),
                        CustomResults.Problem);
                })
            .RequireAuthorization()
            .WithName("PutConnectionsRespond")
            .WithTags(ConnectionsEndpointTags.Connections);
    }

    private static string PastTense(string action) =>
        action.Equals("accept", StringComparison.OrdinalIgnoreCase) ? "accepted" : "rejected";

    private sealed record RespondBody(string Action);
}
