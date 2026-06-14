using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.PlayerIdentity;
using GlobalScout.Application.PlayerIdentity.AddEvidence;

namespace GlobalScout.Api.Endpoints.PlayerIdentity;

internal sealed class PostPlayerIdentityEvidenceUploadUrl : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost(
                PlayerIdentityRoutes.EvidenceUploadUrl,
                async (
                    ClaimsPrincipal principal,
                    InitiateEvidenceUploadRequest request,
                    ICommandHandler<InitiateEvidenceUploadCommand, InitiateEvidenceUploadResult> handler,
                    CancellationToken cancellationToken) =>
                {
                    if (HttpPlayer.RequirePlayer(principal, out var userId) is { } denied)
                    {
                        return denied;
                    }

                    var result = await handler.Handle(
                        new InitiateEvidenceUploadCommand
                        {
                            UserId = userId,
                            FileName = request.FileName,
                            ContentType = request.ContentType,
                            ContentLength = request.ContentLength
                        },
                        cancellationToken);

                    return result.Match(Results.Ok, CustomResults.Problem);
                })
            .RequireAuthorization()
            .WithName("PostPlayerIdentityEvidenceUploadUrl")
            .WithTags(PlayerIdentityEndpointTags.PlayerIdentity);
    }
}

internal sealed class PostPlayerIdentityEvidenceComplete : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost(
                PlayerIdentityRoutes.EvidenceComplete,
                async (
                    ClaimsPrincipal principal,
                    CompleteEvidenceUploadRequest request,
                    ICommandHandler<CompleteEvidenceUploadCommand, VerificationEvidenceDto> handler,
                    CancellationToken cancellationToken) =>
                {
                    if (HttpPlayer.RequirePlayer(principal, out var userId) is { } denied)
                    {
                        return denied;
                    }

                    var result = await handler.Handle(
                        new CompleteEvidenceUploadCommand
                        {
                            UserId = userId,
                            StorageKey = request.StorageKey,
                            FileName = request.FileName,
                            ContentType = request.ContentType,
                            Type = request.Type,
                            Note = request.Note
                        },
                        cancellationToken);

                    return result.Match(Results.Ok, CustomResults.Problem);
                })
            .RequireAuthorization()
            .WithName("PostPlayerIdentityEvidenceComplete")
            .WithTags(PlayerIdentityEndpointTags.PlayerIdentity);
    }
}

internal sealed class PostPlayerIdentityEvidenceLink : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost(
                PlayerIdentityRoutes.EvidenceLink,
                async (
                    ClaimsPrincipal principal,
                    AddLinkEvidenceRequest request,
                    ICommandHandler<AddLinkEvidenceCommand, VerificationEvidenceDto> handler,
                    CancellationToken cancellationToken) =>
                {
                    if (HttpPlayer.RequirePlayer(principal, out var userId) is { } denied)
                    {
                        return denied;
                    }

                    var result = await handler.Handle(
                        new AddLinkEvidenceCommand
                        {
                            UserId = userId,
                            Type = request.Type,
                            Url = request.Url,
                            Note = request.Note
                        },
                        cancellationToken);

                    return result.Match(Results.Ok, CustomResults.Problem);
                })
            .RequireAuthorization()
            .WithName("PostPlayerIdentityEvidenceLink")
            .WithTags(PlayerIdentityEndpointTags.PlayerIdentity);
    }
}
