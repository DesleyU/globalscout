using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Media;
using GlobalScout.Application.Media.GetUserVideos;
using GlobalScout.SharedKernel;

namespace GlobalScout.Api.Endpoints.Media;

internal sealed class GetMediaVideosSelf : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet(
                MediaRoutes.VideosSelf,
                async (
                    ClaimsPrincipal principal,
                    IQueryHandler<GetUserVideosQuery, IReadOnlyList<MediaVideoListItemDto>> handler,
                    CancellationToken cancellationToken) =>
                {
                    var userId = HttpUser.ResolveId(principal);
                    if (userId is null)
                    {
                        return Results.Unauthorized();
                    }

                    var result = await handler.Handle(new GetUserVideosQuery(userId.Value), cancellationToken);
                    return result.Match(Results.Ok, CustomResults.Problem);
                })
            .RequireAuthorization()
            .WithName("GetMediaVideosSelf")
            .WithTags(MediaEndpointTags.Media);
    }
}

internal sealed class GetMediaVideosForUser : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet(
                MediaRoutes.VideosForUser,
                async (
                    Guid userId,
                    ClaimsPrincipal _,
                    IQueryHandler<GetUserVideosQuery, IReadOnlyList<MediaVideoListItemDto>> handler,
                    CancellationToken cancellationToken) =>
                {
                    var result = await handler.Handle(new GetUserVideosQuery(userId), cancellationToken);
                    return result.Match(Results.Ok, CustomResults.Problem);
                })
            .RequireAuthorization()
            .WithName("GetMediaVideosForUser")
            .WithTags(MediaEndpointTags.Media);
    }
}
