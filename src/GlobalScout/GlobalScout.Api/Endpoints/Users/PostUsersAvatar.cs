using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Users;
using GlobalScout.Application.Users.GetAvatarReadUrl;
using GlobalScout.Application.Users.UploadAvatar;
using GlobalScout.SharedKernel;

namespace GlobalScout.Api.Endpoints.Users;

internal sealed class PostUsersAvatarUploadUrl : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost(
                UsersRoutes.AvatarUploadUrl,
                async (
                    ClaimsPrincipal principal,
                    InitiateAvatarUploadRequest request,
                    ICommandHandler<InitiateAvatarUploadCommand, InitiateAvatarUploadResult> handler,
                    CancellationToken cancellationToken) =>
                {
                    var userId = HttpUser.ResolveId(principal);
                    if (userId is null)
                    {
                        return Results.Unauthorized();
                    }

                    var command = new InitiateAvatarUploadCommand
                    {
                        UserId = userId.Value,
                        FileName = request.FileName,
                        ContentType = request.ContentType,
                        ContentLength = request.ContentLength
                    };

                    var result = await handler.Handle(command, cancellationToken);

                    return result.Match(Results.Ok, CustomResults.Problem);
                })
            .RequireAuthorization()
            .WithName("PostUsersAvatarUploadUrl")
            .WithTags(UsersEndpointTags.Users);
    }
}

internal sealed class PostUsersAvatarComplete : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost(
                UsersRoutes.CompleteAvatarUpload,
                async (
                    ClaimsPrincipal principal,
                    CompleteAvatarUploadRequest request,
                    ICommandHandler<CompleteAvatarUploadCommand, CompleteAvatarUploadResult> handler,
                    CancellationToken cancellationToken) =>
                {
                    var userId = HttpUser.ResolveId(principal);
                    if (userId is null)
                    {
                        return Results.Unauthorized();
                    }

                    var result = await handler.Handle(
                        new CompleteAvatarUploadCommand
                        {
                            UserId = userId.Value,
                            StorageKey = request.StorageKey
                        },
                        cancellationToken);

                    return result.Match(Results.Ok, CustomResults.Problem);
                })
            .RequireAuthorization()
            .WithName("PostUsersAvatarComplete")
            .WithTags(UsersEndpointTags.Users);
    }
}

internal sealed class GetUsersAvatarUrl : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet(
                UsersRoutes.AvatarReadUrl,
                async (
                    Guid userId,
                    IQueryHandler<GetAvatarReadUrlQuery, AvatarReadUrlResult> handler,
                    CancellationToken cancellationToken) =>
                {
                    var result = await handler.Handle(
                        new GetAvatarReadUrlQuery(userId),
                        cancellationToken);

                    return result.Match(Results.Ok, CustomResults.Problem);
                })
            .WithName("GetUsersAvatarUrl")
            .WithTags(UsersEndpointTags.Users);
    }
}

internal sealed record InitiateAvatarUploadRequest(
    string FileName,
    string ContentType,
    long ContentLength);

internal sealed record CompleteAvatarUploadRequest(string StorageKey);
