using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Media;
using GlobalScout.Application.Media.GetUserPhotos;
using GlobalScout.SharedKernel;

namespace GlobalScout.Api.Endpoints.Media;

internal sealed class GetMediaPhotosSelf : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet(
                MediaRoutes.PhotosSelf,
                async (
                    ClaimsPrincipal principal,
                    IQueryHandler<GetUserPhotosQuery, IReadOnlyList<MediaVideoListItemDto>> handler,
                    CancellationToken cancellationToken) =>
                {
                    var userId = HttpUser.ResolveId(principal);
                    if (userId is null)
                    {
                        return Results.Unauthorized();
                    }

                    var result = await handler.Handle(new GetUserPhotosQuery(userId.Value), cancellationToken);
                    return result.Match(Results.Ok, CustomResults.Problem);
                })
            .RequireAuthorization()
            .WithName("GetMediaPhotosSelf")
            .WithTags(MediaEndpointTags.Media);
    }
}

internal sealed class GetMediaPhotosForUser : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet(
                MediaRoutes.PhotosForUser,
                async (
                    Guid userId,
                    ClaimsPrincipal _,
                    IQueryHandler<GetUserPhotosQuery, IReadOnlyList<MediaVideoListItemDto>> handler,
                    CancellationToken cancellationToken) =>
                {
                    var result = await handler.Handle(new GetUserPhotosQuery(userId), cancellationToken);
                    return result.Match(Results.Ok, CustomResults.Problem);
                })
            .RequireAuthorization()
            .WithName("GetMediaPhotosForUser")
            .WithTags(MediaEndpointTags.Media);
    }
}
