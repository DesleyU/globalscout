using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Authorization;
using GlobalScout.Application.PlayerIdentity;
using GlobalScout.Application.PlayerIdentity.Admin.ApproveClaim;
using GlobalScout.Application.PlayerIdentity.Admin.RejectClaim;
using GlobalScout.Application.PlayerIdentity.Admin.RequestMoreInfo;

namespace GlobalScout.Api.Endpoints.Admin;

internal sealed class PostAdminPlayerClaimApprove : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost(
                AdminRoutes.PlayerClaimApprove,
                async (
                    ClaimsPrincipal principal,
                    Guid claimId,
                    AdminPlayerClaimNoteRequest? body,
                    ICommandHandler<ApprovePlayerIdentityClaimCommand, PlayerIdentityClaimDto> handler,
                    CancellationToken cancellationToken) =>
                {
                    var adminId = HttpUser.ResolveId(principal);
                    if (adminId is null)
                    {
                        return Results.Unauthorized();
                    }

                    var result = await handler.Handle(
                        new ApprovePlayerIdentityClaimCommand
                        {
                            AdminUserId = adminId.Value,
                            ClaimId = claimId,
                            Note = body?.Note
                        },
                        cancellationToken);

                    return result.Match(Results.Ok, CustomResults.Problem);
                })
            .RequireAuthorization(AuthorizationPolicyNames.Admin)
            .WithName("AdminApprovePlayerClaim")
            .WithTags(AdminEndpointTags.Admin);
    }
}

internal sealed class PostAdminPlayerClaimReject : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost(
                AdminRoutes.PlayerClaimReject,
                async (
                    ClaimsPrincipal principal,
                    Guid claimId,
                    AdminPlayerClaimRequiredNoteRequest body,
                    ICommandHandler<RejectPlayerIdentityClaimCommand, PlayerIdentityClaimDto> handler,
                    CancellationToken cancellationToken) =>
                {
                    var adminId = HttpUser.ResolveId(principal);
                    if (adminId is null)
                    {
                        return Results.Unauthorized();
                    }

                    var result = await handler.Handle(
                        new RejectPlayerIdentityClaimCommand
                        {
                            AdminUserId = adminId.Value,
                            ClaimId = claimId,
                            Note = body.Note
                        },
                        cancellationToken);

                    return result.Match(Results.Ok, CustomResults.Problem);
                })
            .RequireAuthorization(AuthorizationPolicyNames.Admin)
            .WithName("AdminRejectPlayerClaim")
            .WithTags(AdminEndpointTags.Admin);
    }
}

internal sealed class PostAdminPlayerClaimRequestInfo : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost(
                AdminRoutes.PlayerClaimRequestInfo,
                async (
                    ClaimsPrincipal principal,
                    Guid claimId,
                    AdminPlayerClaimRequiredNoteRequest body,
                    ICommandHandler<RequestMorePlayerIdentityInfoCommand, PlayerIdentityClaimDto> handler,
                    CancellationToken cancellationToken) =>
                {
                    var adminId = HttpUser.ResolveId(principal);
                    if (adminId is null)
                    {
                        return Results.Unauthorized();
                    }

                    var result = await handler.Handle(
                        new RequestMorePlayerIdentityInfoCommand
                        {
                            AdminUserId = adminId.Value,
                            ClaimId = claimId,
                            Note = body.Note
                        },
                        cancellationToken);

                    return result.Match(Results.Ok, CustomResults.Problem);
                })
            .RequireAuthorization(AuthorizationPolicyNames.Admin)
            .WithName("AdminRequestMorePlayerClaimInfo")
            .WithTags(AdminEndpointTags.Admin);
    }
}

internal sealed record AdminPlayerClaimNoteRequest(string? Note);

internal sealed record AdminPlayerClaimRequiredNoteRequest(string Note);
