using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Social;
using GlobalScout.Application.Social.Notifications.GetNotifications;
using GlobalScout.SharedKernel;

namespace GlobalScout.Api.Endpoints.Social.Notifications;

internal sealed class GetNotificationsList : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet(
                NotificationsRoutes.List,
                async (
                    ClaimsPrincipal user,
                    int? page,
                    int? limit,
                    IQueryHandler<GetNotificationsQuery, GetNotificationsResult> handler,
                    CancellationToken cancellationToken) =>
                {
                    var userId = HttpUser.ResolveId(user);
                    if (userId is null)
                    {
                        return Results.Unauthorized();
                    }

                    var query = new GetNotificationsQuery(userId.Value, page ?? 1, limit ?? 20);

                    var result = await handler.Handle(query, cancellationToken);

                    return result.Match(
                        ok => Results.Ok(
                            new
                            {
                                notifications = ok.Items,
                                pagination = ok.Pagination,
                                unreadCount = ok.UnreadCount
                            }),
                        CustomResults.Problem);
                })
            .RequireAuthorization()
            .WithName("GetNotificationsList")
            .WithTags(NotificationsEndpointTags.Notifications);
    }
}
