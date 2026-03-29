using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Social.Messages;
using GlobalScout.Application.Social.Messages.SendMessage;
using GlobalScout.SharedKernel;

namespace GlobalScout.Api.Endpoints.Social.Messages;

internal sealed class PostMessagesSend : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost(
                MessagesRoutes.Base,
                async (
                    ClaimsPrincipal user,
                    SendMessageBody body,
                    ICommandHandler<SendMessageCommand, MessageDetailDto> handler,
                    CancellationToken cancellationToken) =>
                {
                    var senderId = HttpUser.ResolveId(user);
                    if (senderId is null)
                    {
                        return Results.Unauthorized();
                    }

                    var command = new SendMessageCommand
                    {
                        SenderId = senderId.Value,
                        ReceiverId = body.ReceiverId,
                        Content = body.Content
                    };

                    var result = await handler.Handle(command, cancellationToken);

                    return result.Match(
                        ok => Results.Json(
                            new
                            {
                                message = "Message sent successfully",
                                data = ok
                            },
                            statusCode: StatusCodes.Status201Created),
                        CustomResults.Problem);
                })
            .RequireAuthorization()
            .WithName("PostMessagesSend")
            .WithTags(MessagesEndpointTags.Messages);
    }

    private sealed record SendMessageBody(Guid ReceiverId, string Content);
}
