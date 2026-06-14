using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Social.Messages.MarkRead;
using GlobalScout.SharedKernel;

namespace GlobalScout.Api.Endpoints.Social.Messages;

internal sealed class PutMessagesRead : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPut(
                MessagesRoutes.Read,
                async (
                    ClaimsPrincipal user,
                    Guid otherUserId,
                    ICommandHandler<MarkMessagesReadCommand, int> handler,
                    CancellationToken cancellationToken) =>
                {
                    var userId = HttpUser.ResolveId(user);
                    if (userId is null)
                    {
                        return Results.Unauthorized();
                    }

                    var result = await handler.Handle(
                        new MarkMessagesReadCommand { UserId = userId.Value, OtherUserId = otherUserId },
                        cancellationToken);

                    return result.Match(
                        _ => Results.Json(new { message = "Messages marked as read" }),
                        CustomResults.Problem);
                })
            .RequireAuthorization()
            .WithName("PutMessagesRead")
            .WithTags(MessagesEndpointTags.Messages);
    }
}
