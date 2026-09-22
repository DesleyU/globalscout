using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Dev.SeedTestUsers;
using GlobalScout.SharedKernel;

namespace GlobalScout.Api.Endpoints.Dev;

/// <summary>
/// Bulk-creates fake, pre-verified test users for local testing. Mapped only in Development -
/// never reachable in production regardless of routing/auth misconfiguration elsewhere.
/// </summary>
internal sealed class PostDevSeedUsers : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        var env = app.ServiceProvider.GetRequiredService<IHostEnvironment>();
        if (!env.IsDevelopment())
        {
            return;
        }

        app.MapPost(
                DevRoutes.SeedUsers,
                async (
                    SeedTestUsersRequest body,
                    ICommandHandler<SeedTestUsersCommand, SeedTestUsersResult> handler,
                    CancellationToken cancellationToken) =>
                {
                    var command = new SeedTestUsersCommand(body.Role, body.Count);
                    var result = await handler.Handle(command, cancellationToken);
                    return result.Match(Results.Ok, CustomResults.Problem);
                })
            .WithName("PostDevSeedUsers")
            .WithTags(DevEndpointTags.Dev);
    }

    private sealed record SeedTestUsersRequest(string Role, int Count);
}
