using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Social;
using GlobalScout.Application.Social.GetPendingRequests;
using GlobalScout.SharedKernel;

namespace GlobalScout.Api.Endpoints.Social.Connections;

internal sealed class GetConnectionsRequests : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet(
                ConnectionsRoutes.Requests,
                async (
                    ClaimsPrincipal user,
                    string? type,
                    int? page,
                    int? limit,
                    IQueryHandler<GetPendingConnectionRequestsQuery, GetPendingConnectionRequestsResult> handler,
                    CancellationToken cancellationToken) =>
                {
                    var userId = HttpUser.ResolveId(user);
                    if (userId is null)
                    {
                        return Results.Unauthorized();
                    }

                    var query = new GetPendingConnectionRequestsQuery(
                        userId.Value,
                        type,
                        page ?? 1,
                        limit ?? 20);

                    var result = await handler.Handle(query, cancellationToken);

                    return result.Match(
                        ok => Results.Ok(
                            new
                            {
                                requests = ok.Requests,
                                pagination = ok.Pagination
                            }),
                        CustomResults.Problem);
                })
            .RequireAuthorization()
            .WithName("GetConnectionsRequests")
            .WithTags(ConnectionsEndpointTags.Connections);
    }
}
