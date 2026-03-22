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
                    IFormFile file,
                    ICommandHandler<UploadUserAvatarCommand, UploadUserAvatarResult> handler,
                    CancellationToken cancellationToken) =>
                {
                    var userId = HttpUser.ResolveId(principal);
                    if (userId is null)
                    {
                        return Results.Unauthorized();
                    }

                    var stream = file.OpenReadStream();
                    var command = new UploadUserAvatarCommand
                    {
                        UserId = userId.Value,
                        FileStream = stream,
                        FileName = file.FileName,
                        ContentType = file.ContentType ?? "application/octet-stream"
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
