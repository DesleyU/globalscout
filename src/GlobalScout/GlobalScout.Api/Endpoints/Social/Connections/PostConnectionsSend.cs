using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Social;
using GlobalScout.Application.Social.SendConnection;
using GlobalScout.SharedKernel;

namespace GlobalScout.Api.Endpoints.Social.Connections;

internal sealed class PostConnectionsSend : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost(
                ConnectionsRoutes.Send,
                async (
                    ClaimsPrincipal user,
                    SendConnectionRequestBody body,
                    ICommandHandler<SendConnectionRequestCommand, SendConnectionResponseDto> handler,
                    CancellationToken cancellationToken) =>
                {
                    var senderId = HttpUser.ResolveId(user);
                    if (senderId is null)
                    {
                        return Results.Unauthorized();
                    }

                    var command = new SendConnectionRequestCommand
                    {
                        SenderId = senderId.Value,
                        ReceiverId = body.ReceiverId,
                        Message = body.Message
                    };

                    var result = await handler.Handle(command, cancellationToken);

                    if (result.IsFailure && result.Error.Code == "Connections.LimitReached")
                    {
                        return LimitReached(result.Error);
                    }

                    return result.Match(
                        ok => Results.Json(
                            new
                            {
                                message = "Connection request sent successfully",
                                connection = ok
                            },
                            statusCode: StatusCodes.Status201Created),
                        CustomResults.Problem);
                })
            .RequireAuthorization()
            .WithName("PostConnectionsSend")
            .WithTags(ConnectionsEndpointTags.Connections);
    }

    private static IResult LimitReached(Error error)
    {
        var ext = error.Extensions!;
        return Results.Json(
            new
            {
                error = "Connection limit reached",
                message = error.Description,
                currentConnections = ext["currentConnections"],
                maxConnections = ext["maxConnections"],
                tier = ext["tier"]
            },
            statusCode: StatusCodes.Status403Forbidden);
    }

    private sealed record SendConnectionRequestBody(Guid ReceiverId, string? Message);
}
