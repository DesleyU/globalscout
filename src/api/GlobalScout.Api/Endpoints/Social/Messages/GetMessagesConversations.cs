using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Social.Messages;
using GlobalScout.Application.Social.Messages.GetConversations;
using GlobalScout.SharedKernel;

namespace GlobalScout.Api.Endpoints.Social.Messages;

internal sealed class GetMessagesConversations : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet(
                MessagesRoutes.Conversations,
                async (
                    ClaimsPrincipal user,
                    IQueryHandler<GetConversationsQuery, GetConversationsResult> handler,
                    CancellationToken cancellationToken) =>
                {
                    var userId = HttpUser.ResolveId(user);
                    if (userId is null)
                    {
                        return Results.Unauthorized();
                    }

                    var result = await handler.Handle(new GetConversationsQuery(userId.Value), cancellationToken);

                    return result.Match(
                        ok => Results.Json(new { conversations = ok.Conversations }),
                        CustomResults.Problem);
                })
            .RequireAuthorization()
            .WithName("GetMessagesConversations")
            .WithTags(MessagesEndpointTags.Messages);
    }
}
