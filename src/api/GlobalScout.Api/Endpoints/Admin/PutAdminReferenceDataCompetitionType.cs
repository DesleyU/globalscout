using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.ReferenceData;
using GlobalScout.Application.Authorization;
using GlobalScout.Application.ReferenceData.Admin.SetCompetitionType;

namespace GlobalScout.Api.Endpoints.Admin;

internal sealed class PutAdminReferenceDataCompetitionType : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPut(
                AdminRoutes.ReferenceDataCompetitionType,
                async (
                    Guid competitionId,
                    SetCompetitionTypeRequest body,
                    ICommandHandler<SetCompetitionTypeCommand, AdminFootballCompetitionDto> handler,
                    CancellationToken cancellationToken) =>
                {
                    var result = await handler.Handle(
                        new SetCompetitionTypeCommand(competitionId, body.Type),
                        cancellationToken);

                    return result.Match(Results.Ok, CustomResults.Problem);
                })
            .RequireAuthorization(AuthorizationPolicyNames.Admin)
            .WithName("AdminSetReferenceDataCompetitionType")
            .WithTags(AdminEndpointTags.Admin);
    }
}
