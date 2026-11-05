using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Media;
using GlobalScout.Application.Media.DeletePhoto;
using GlobalScout.SharedKernel;

namespace GlobalScout.Api.Endpoints.Media;

internal sealed class DeleteMediaPhoto : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapDelete(
                MediaRoutes.DeletePhoto,
                async (
                    Guid photoId,
                    ClaimsPrincipal principal,
                    ICommandHandler<DeletePhotoCommand, DeletePhotoResult> handler,
                    CancellationToken cancellationToken) =>
                {
                    var userId = HttpUser.ResolveId(principal);
                    if (userId is null)
                    {
                        return Results.Unauthorized();
                    }

                    var command = new DeletePhotoCommand { UserId = userId.Value, PhotoId = photoId };
                    var result = await handler.Handle(command, cancellationToken);
                    return result.Match(
                        ok => Results.Json(new { message = ok.Message }),
                        CustomResults.Problem);
                })
            .RequireAuthorization()
            .WithName("DeleteMediaPhoto")
            .WithTags(MediaEndpointTags.Media);
    }
}
