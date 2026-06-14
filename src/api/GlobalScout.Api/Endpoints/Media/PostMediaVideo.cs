using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Media;
using GlobalScout.Application.Media.GetMediaReadUrl;
using GlobalScout.Application.Media.UploadVideo;
using GlobalScout.SharedKernel;

namespace GlobalScout.Api.Endpoints.Media;

internal sealed class PostMediaVideoUploadUrl : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost(
                MediaRoutes.VideoUploadUrl,
                async (
                    ClaimsPrincipal principal,
                    InitiateVideoUploadRequest request,
                    ICommandHandler<InitiateVideoUploadCommand, InitiateVideoUploadResult> handler,
                    CancellationToken cancellationToken) =>
                {
                    var userId = HttpUser.ResolveId(principal);
                    if (userId is null)
                    {
                        return Results.Unauthorized();
                    }

                    var command = new InitiateVideoUploadCommand
                    {
                        UserId = userId.Value,
                        FileName = request.FileName,
                        ContentType = request.ContentType,
                        ContentLength = request.ContentLength
                    };

                    var result = await handler.Handle(command, cancellationToken);

                    if (result.IsFailure && result.Error.Code == "Media.VideoLimitReached")
                    {
                        return MediaVideoUploadResponses.VideoLimitReached(result.Error);
                    }

                    return result.Match(
                        ok => Results.Ok(ok),
                        CustomResults.Problem);
                })
            .RequireAuthorization()
            .WithName("PostMediaVideoUploadUrl")
            .WithTags(MediaEndpointTags.Media);
    }

}

internal sealed class PostMediaVideoComplete : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost(
                MediaRoutes.CompleteVideoUpload,
                async (
                    ClaimsPrincipal principal,
                    CompleteVideoUploadRequest request,
                    ICommandHandler<CompleteVideoUploadCommand, CompleteVideoUploadResult> handler,
                    CancellationToken cancellationToken) =>
                {
                    var userId = HttpUser.ResolveId(principal);
                    if (userId is null)
                    {
                        return Results.Unauthorized();
                    }

                    var command = new CompleteVideoUploadCommand
                    {
                        UserId = userId.Value,
                        StorageKey = request.StorageKey,
                        FileName = request.FileName,
                        ContentType = request.ContentType,
                        Title = request.Title,
                        Description = request.Description,
                        Tags = request.Tags
                    };

                    var result = await handler.Handle(command, cancellationToken);
                    if (result.IsFailure && result.Error.Code == "Media.VideoLimitReached")
                    {
                        return MediaVideoUploadResponses.VideoLimitReached(result.Error);
                    }

                    return result.Match(
                        ok => Results.Json(
                            new
                            {
                                id = ok.Id,
                                storageKey = ok.StorageKey,
                                title = ok.Title,
                                description = ok.Description,
                                tags = ok.Tags,
                                createdAt = ok.CreatedAt
                            }),
                        CustomResults.Problem);
                })
            .RequireAuthorization()
            .WithName("PostMediaVideoComplete")
            .WithTags(MediaEndpointTags.Media);
    }
}

internal sealed class GetMediaReadUrl : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet(
                MediaRoutes.MediaReadUrl,
                async (
                    ClaimsPrincipal principal,
                    Guid mediaId,
                    IQueryHandler<GetMediaReadUrlQuery, MediaReadUrlResult> handler,
                    CancellationToken cancellationToken) =>
                {
                    var requesterId = HttpUser.ResolveId(principal);
                    if (requesterId is null)
                    {
                        return Results.Unauthorized();
                    }

                    var result = await handler.Handle(
                        new GetMediaReadUrlQuery(requesterId.Value, mediaId),
                        cancellationToken);

                    return result.Match(Results.Ok, CustomResults.Problem);
                })
            .RequireAuthorization()
            .WithName("GetMediaReadUrl")
            .WithTags(MediaEndpointTags.Media);
    }
}

internal sealed record InitiateVideoUploadRequest(
    string FileName,
    string ContentType,
    long ContentLength);

internal sealed record CompleteVideoUploadRequest(
    string StorageKey,
    string FileName,
    string ContentType,
    string? Title,
    string? Description,
    string? Tags);

file static class MediaVideoUploadResponses
{
    public static IResult VideoLimitReached(Error error)
    {
        var ext = error.Extensions!;
        return Results.Json(
            new
            {
                error = "Video upload limit reached",
                message = error.Description,
                limit = ext["limit"],
                current = ext["current"]
            },
            statusCode: StatusCodes.Status403Forbidden);
    }
}
