using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Social;
using GlobalScout.Application.Social.Notifications.MarkNotificationRead;
using GlobalScout.SharedKernel;

namespace GlobalScout.Api.Endpoints.Social.Notifications;

internal sealed class PutNotificationsRead : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPut(
                NotificationsRoutes.Read,
                async (
                    ClaimsPrincipal user,
                    Guid notificationId,
                    ICommandHandler<MarkNotificationReadCommand, MarkNotificationReadResult> handler,
                    CancellationToken cancellationToken) =>
                {
                    var userId = HttpUser.ResolveId(user);
                    if (userId is null)
                    {
                        return Results.Unauthorized();
                    }

                    var result = await handler.Handle(
                        new MarkNotificationReadCommand(userId.Value, notificationId),
                        cancellationToken);

                    return result.Match(Results.Ok, CustomResults.Problem);
                })
            .RequireAuthorization()
            .WithName("PutNotificationsRead")
            .WithTags(NotificationsEndpointTags.Notifications);
    }
}
