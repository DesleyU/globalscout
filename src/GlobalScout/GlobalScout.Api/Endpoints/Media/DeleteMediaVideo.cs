using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Media;
using GlobalScout.Application.Media.DeleteVideo;
using GlobalScout.SharedKernel;

namespace GlobalScout.Api.Endpoints.Media;

internal sealed class DeleteMediaVideo : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapDelete(
                MediaRoutes.DeleteVideo,
                async (
                    Guid videoId,
                    ClaimsPrincipal principal,
                    ICommandHandler<DeleteVideoCommand, DeleteVideoResult> handler,
                    CancellationToken cancellationToken) =>
                {
                    var userId = HttpUser.ResolveId(principal);
                    if (userId is null)
                    {
                        return Results.Unauthorized();
                    }

                    var command = new DeleteVideoCommand { UserId = userId.Value, VideoId = videoId };
                    var result = await handler.Handle(command, cancellationToken);
                    return result.Match(
                        ok => Results.Json(new { message = ok.Message }),
                        CustomResults.Problem);
                })
            .RequireAuthorization()
            .WithName("DeleteMediaVideo")
            .WithTags(MediaEndpointTags.Media);
    }
}
