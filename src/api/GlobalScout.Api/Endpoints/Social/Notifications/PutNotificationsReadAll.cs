using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Social;
using GlobalScout.Application.Social.Notifications.MarkAllNotificationsRead;
using GlobalScout.SharedKernel;

namespace GlobalScout.Api.Endpoints.Social.Notifications;

internal sealed class PutNotificationsReadAll : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPut(
                NotificationsRoutes.ReadAll,
                async (
                    ClaimsPrincipal user,
                    ICommandHandler<MarkAllNotificationsReadCommand, MarkAllNotificationsReadResult> handler,
                    CancellationToken cancellationToken) =>
                {
                    var userId = HttpUser.ResolveId(user);
                    if (userId is null)
                    {
                        return Results.Unauthorized();
                    }

                    var result = await handler.Handle(
                        new MarkAllNotificationsReadCommand(userId.Value),
                        cancellationToken);

                    return result.Match(Results.Ok, CustomResults.Problem);
                })
            .RequireAuthorization()
            .WithName("PutNotificationsReadAll")
            .WithTags(NotificationsEndpointTags.Notifications);
    }
}
