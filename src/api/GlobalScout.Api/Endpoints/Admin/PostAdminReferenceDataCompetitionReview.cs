using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.ReferenceData;
using GlobalScout.Application.Authorization;
using GlobalScout.Application.ReferenceData.Admin.ReviewCompetition;

namespace GlobalScout.Api.Endpoints.Admin;

internal sealed class PostAdminReferenceDataCompetitionApprove : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost(
                AdminRoutes.ReferenceDataCompetitionApprove,
                async (
                    Guid competitionId,
                    ApproveCompetitionRequest body,
                    ICommandHandler<ReviewCompetitionSubmissionCommand, AdminFootballCompetitionDto> handler,
                    CancellationToken cancellationToken) =>
                {
                    var result = await handler.Handle(
                        new ReviewCompetitionSubmissionCommand(
                            competitionId,
                            Approve: true,
                            body.Level,
                            body.Type),
                        cancellationToken);

                    return result.Match(Results.Ok, CustomResults.Problem);
                })
            .RequireAuthorization(AuthorizationPolicyNames.Admin)
            .WithName("AdminApproveReferenceDataLeague")
            .WithTags(AdminEndpointTags.Admin);
    }
}

internal sealed class PostAdminReferenceDataCompetitionReject : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost(
                AdminRoutes.ReferenceDataCompetitionReject,
                async (
                    Guid competitionId,
                    ICommandHandler<ReviewCompetitionSubmissionCommand, AdminFootballCompetitionDto> handler,
                    CancellationToken cancellationToken) =>
                {
                    var result = await handler.Handle(
                        new ReviewCompetitionSubmissionCommand(
                            competitionId,
                            Approve: false,
                            Level: null,
                            Type: null),
                        cancellationToken);

                    return result.Match(Results.Ok, CustomResults.Problem);
                })
            .RequireAuthorization(AuthorizationPolicyNames.Admin)
            .WithName("AdminRejectReferenceDataLeague")
            .WithTags(AdminEndpointTags.Admin);
    }
}
