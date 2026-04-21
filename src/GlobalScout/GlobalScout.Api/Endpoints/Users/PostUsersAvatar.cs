using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Users;
using GlobalScout.Application.Users.UploadAvatar;
using GlobalScout.SharedKernel;

namespace GlobalScout.Api.Endpoints.Users;

internal sealed class PostUsersAvatar : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost(
                UsersRoutes.Avatar,
                async (
                    ClaimsPrincipal principal,
                    IFormFile avatar,
                    ICommandHandler<UploadUserAvatarCommand, UploadUserAvatarResult> handler,
                    CancellationToken cancellationToken) =>
                {
                    var userId = HttpUser.ResolveId(principal);
                    if (userId is null)
                    {
                        return Results.Unauthorized();
                    }

                    if (avatar is null || avatar.Length <= 0)
                    {
                        return Results.BadRequest(new { error = "Missing avatar file." });
                    }

                    var stream = avatar.OpenReadStream();
                    var command = new UploadUserAvatarCommand
                    {
                        UserId = userId.Value,
                        FileStream = stream,
                        FileName = avatar.FileName,
                        ContentType = avatar.ContentType ?? "application/octet-stream"
                    };

                    var result = await handler.Handle(command, cancellationToken);

                    return result.Match(Results.Ok, CustomResults.Problem);
                })
            .DisableAntiforgery()
            .RequireAuthorization()
            .WithName("PostUsersAvatar")
            .WithTags(UsersEndpointTags.Users);
    }
}
