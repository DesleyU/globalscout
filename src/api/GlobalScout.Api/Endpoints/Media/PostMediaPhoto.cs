using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Media;
using GlobalScout.Application.Media.UploadPhoto;
using GlobalScout.SharedKernel;

namespace GlobalScout.Api.Endpoints.Media;

internal sealed class PostMediaPhotoUploadUrl : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost(
                MediaRoutes.PhotoUploadUrl,
                async (
                    ClaimsPrincipal principal,
                    InitiatePhotoUploadRequest request,
                    ICommandHandler<InitiatePhotoUploadCommand, InitiatePhotoUploadResult> handler,
                    CancellationToken cancellationToken) =>
                {
                    var userId = HttpUser.ResolveId(principal);
                    if (userId is null)
                    {
                        return Results.Unauthorized();
                    }

                    var command = new InitiatePhotoUploadCommand
                    {
                        UserId = userId.Value,
                        FileName = request.FileName,
                        ContentType = request.ContentType,
                        ContentLength = request.ContentLength
                    };

                    var result = await handler.Handle(command, cancellationToken);

                    if (result.IsFailure && result.Error.Code == "Media.PhotoLimitReached")
                    {
                        return MediaPhotoUploadResponses.PhotoLimitReached(result.Error);
                    }

                    return result.Match(
                        ok => Results.Ok(ok),
                        CustomResults.Problem);
                })
            .RequireAuthorization()
            .WithName("PostMediaPhotoUploadUrl")
            .WithTags(MediaEndpointTags.Media);
    }
}

internal sealed class PostMediaPhotoComplete : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost(
                MediaRoutes.CompletePhotoUpload,
                async (
                    ClaimsPrincipal principal,
                    CompletePhotoUploadRequest request,
                    ICommandHandler<CompletePhotoUploadCommand, CompletePhotoUploadResult> handler,
                    CancellationToken cancellationToken) =>
                {
                    var userId = HttpUser.ResolveId(principal);
                    if (userId is null)
                    {
                        return Results.Unauthorized();
                    }

                    var command = new CompletePhotoUploadCommand
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
                    if (result.IsFailure && result.Error.Code == "Media.PhotoLimitReached")
                    {
                        return MediaPhotoUploadResponses.PhotoLimitReached(result.Error);
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
            .WithName("PostMediaPhotoComplete")
            .WithTags(MediaEndpointTags.Media);
    }
}

internal sealed record InitiatePhotoUploadRequest(
    string FileName,
    string ContentType,
    long ContentLength);

internal sealed record CompletePhotoUploadRequest(
    string StorageKey,
    string FileName,
    string ContentType,
    string? Title,
    string? Description,
    string? Tags);

file static class MediaPhotoUploadResponses
{
    public static IResult PhotoLimitReached(Error error)
    {
        var ext = error.Extensions!;
        return Results.Json(
            new
            {
                error = "Photo upload limit reached",
                message = error.Description,
                limit = ext["limit"],
                current = ext["current"]
            },
            statusCode: StatusCodes.Status403Forbidden);
    }
}
