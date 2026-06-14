using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Social;
using GlobalScout.Application.Social.Connections.GetConnections;
using GlobalScout.SharedKernel;

namespace GlobalScout.Api.Endpoints.Social.Connections;

internal sealed class GetConnectionsList : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet(
                ConnectionsRoutes.List,
                async (
                    ClaimsPrincipal user,
                    string? status,
                    int? page,
                    int? limit,
                    IQueryHandler<GetConnectionsQuery, GetConnectionsResult> handler,
                    CancellationToken cancellationToken) =>
                {
                    var userId = HttpUser.ResolveId(user);
                    if (userId is null)
                    {
                        return Results.Unauthorized();
                    }

                    var query = new GetConnectionsQuery(
                        userId.Value,
                        status,
                        page ?? 1,
                        limit ?? 20);

                    var result = await handler.Handle(query, cancellationToken);

                    return result.Match(
                        ok => Results.Ok(
                            new
                            {
                                connections = ok.Connections,
                                pagination = ok.Pagination
                            }),
                        CustomResults.Problem);
                })
            .RequireAuthorization()
            .WithName("GetConnectionsList")
            .WithTags(ConnectionsEndpointTags.Connections);
    }
}
