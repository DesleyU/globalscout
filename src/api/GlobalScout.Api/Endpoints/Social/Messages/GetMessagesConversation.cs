using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Social.Messages;
using GlobalScout.Application.Social.Messages.GetConversation;
using GlobalScout.SharedKernel;

namespace GlobalScout.Api.Endpoints.Social.Messages;

internal sealed class GetMessagesConversation : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet(
                MessagesRoutes.Conversation,
                async (
                    ClaimsPrincipal user,
                    Guid otherUserId,
                    string? before,
                    int? limit,
                    IQueryHandler<GetConversationQuery, GetConversationResult> handler,
                    CancellationToken cancellationToken) =>
                {
                    var userId = HttpUser.ResolveId(user);
                    if (userId is null)
                    {
                        return Results.Unauthorized();
                    }

                    int l = !limit.HasValue || limit.Value < 1 ? 50 : Math.Min(limit.Value, 200);

                    var result = await handler.Handle(
                        new GetConversationQuery(userId.Value, otherUserId, before, l),
                        cancellationToken);

                    return result.Match(
                        ok => Results.Json(
                            new
                            {
                                messages = ok.Messages,
                                nextCursor = ok.NextCursor,
                                hasMore = ok.HasMore
                            }),
                        CustomResults.Problem);
                })
            .RequireAuthorization()
            .WithName("GetMessagesConversation")
            .WithTags(MessagesEndpointTags.Messages);
    }
}
