using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Media;
using GlobalScout.Application.Media.UploadVideo;
using GlobalScout.SharedKernel;

namespace GlobalScout.Api.Endpoints.Media;

internal sealed class PostMediaVideo : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost(
                MediaRoutes.Video,
                async (
                    HttpContext httpContext,
                    ClaimsPrincipal principal,
                    ICommandHandler<UploadVideoCommand, UploadVideoResult> handler,
                    CancellationToken cancellationToken) =>
                {
                    var userId = HttpUser.ResolveId(principal);
                    if (userId is null)
                    {
                        return Results.Unauthorized();
                    }

                    if (!httpContext.Request.HasFormContentType)
                    {
                        return Results.BadRequest(new { error = "Expected multipart form data." });
                    }

                    var form = await httpContext.Request.ReadFormAsync(cancellationToken);
                    var file = form.Files["video"];
                    if (file is null || file.Length == 0)
                    {
                        return Results.BadRequest(new { error = "No video file provided" });
                    }

                    var command = new UploadVideoCommand
                    {
                        UserId = userId.Value,
                        FileStream = file.OpenReadStream(),
                        FileName = file.FileName,
                        ContentType = file.ContentType ?? string.Empty,
                        Title = form["title"].ToString(),
                        Description = form["description"].ToString(),
                        Tags = form["tags"].ToString()
                    };

                    var result = await handler.Handle(command, cancellationToken);

                    if (result.IsFailure && result.Error.Code == "Media.VideoLimitReached")
                    {
                        return VideoLimitReached(result.Error);
                    }

                    return result.Match(
                        ok => Results.Json(
                            new
                            {
                                id = ok.Id,
                                url = ok.Url,
                                title = ok.Title,
                                description = ok.Description,
                                tags = ok.Tags,
                                createdAt = ok.CreatedAt
                            }),
                        CustomResults.Problem);
                })
            .DisableAntiforgery()
            .RequireAuthorization()
            .WithName("PostMediaVideo")
            .WithTags(MediaEndpointTags.Media);
    }

    private static IResult VideoLimitReached(Error error)
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
