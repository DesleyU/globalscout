using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.ReferenceData;
using GlobalScout.Application.Authorization;
using GlobalScout.Application.ReferenceData.Admin.SetCompetitionLevel;

namespace GlobalScout.Api.Endpoints.Admin;

internal sealed class PutAdminReferenceDataCompetitionLevel : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPut(
                AdminRoutes.ReferenceDataCompetitionLevel,
                async (
                    Guid competitionId,
                    SetCompetitionLevelRequest body,
                    ICommandHandler<SetCompetitionLevelCommand, AdminFootballCompetitionDto> handler,
                    CancellationToken cancellationToken) =>
                {
                    var result = await handler.Handle(
                        new SetCompetitionLevelCommand(competitionId, body.Level),
                        cancellationToken);

                    return result.Match(Results.Ok, CustomResults.Problem);
                })
            .RequireAuthorization(AuthorizationPolicyNames.Admin)
            .WithName("AdminSetReferenceDataCompetitionLevel")
            .WithTags(AdminEndpointTags.Admin);
    }
}
