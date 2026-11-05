using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Users;
using GlobalScout.Application.Users.GetBannerReadUrl;
using GlobalScout.Application.Users.UploadBanner;
using GlobalScout.SharedKernel;

namespace GlobalScout.Api.Endpoints.Users;

internal sealed class PostUsersBannerUploadUrl : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost(
                UsersRoutes.BannerUploadUrl,
                async (
                    ClaimsPrincipal principal,
                    InitiateBannerUploadRequest request,
                    ICommandHandler<InitiateBannerUploadCommand, InitiateBannerUploadResult> handler,
                    CancellationToken cancellationToken) =>
                {
                    var userId = HttpUser.ResolveId(principal);
                    if (userId is null)
                    {
                        return Results.Unauthorized();
                    }

                    var command = new InitiateBannerUploadCommand
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
            .WithName("PostUsersBannerUploadUrl")
            .WithTags(UsersEndpointTags.Users);
    }
}

internal sealed class PostUsersBannerComplete : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost(
                UsersRoutes.CompleteBannerUpload,
                async (
                    ClaimsPrincipal principal,
                    CompleteBannerUploadRequest request,
                    ICommandHandler<CompleteBannerUploadCommand, CompleteBannerUploadResult> handler,
                    CancellationToken cancellationToken) =>
                {
                    var userId = HttpUser.ResolveId(principal);
                    if (userId is null)
                    {
                        return Results.Unauthorized();
                    }

                    var result = await handler.Handle(
                        new CompleteBannerUploadCommand
                        {
                            UserId = userId.Value,
                            StorageKey = request.StorageKey
                        },
                        cancellationToken);

                    return result.Match(Results.Ok, CustomResults.Problem);
                })
            .RequireAuthorization()
            .WithName("PostUsersBannerComplete")
            .WithTags(UsersEndpointTags.Users);
    }
}

internal sealed class GetUsersBannerUrl : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet(
                UsersRoutes.BannerReadUrl,
                async (
                    Guid userId,
                    IQueryHandler<GetBannerReadUrlQuery, BannerReadUrlResult> handler,
                    CancellationToken cancellationToken) =>
                {
                    var result = await handler.Handle(
                        new GetBannerReadUrlQuery(userId),
                        cancellationToken);

                    return result.Match(Results.Ok, CustomResults.Problem);
                })
            .WithName("GetUsersBannerUrl")
            .WithTags(UsersEndpointTags.Users);
    }
}

internal sealed record InitiateBannerUploadRequest(
    string FileName,
    string ContentType,
    long ContentLength);

internal sealed record CompleteBannerUploadRequest(string StorageKey);
