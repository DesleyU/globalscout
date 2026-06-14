using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Account.UpgradeAccount;
using GlobalScout.Domain.Identity;
using GlobalScout.SharedKernel;

namespace GlobalScout.Api.Endpoints.Account;

internal sealed class PostAccountUpgrade : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost(
                AccountRoutes.Upgrade,
                async (
                    ClaimsPrincipal user,
                    ICommandHandler<UpgradeAccountCommand, AccountType> handler,
                    CancellationToken cancellationToken) =>
                {
                    var userId = HttpUser.ResolveId(user);
                    if (userId is null)
                    {
                        return Results.Unauthorized();
                    }

                    var result = await handler.Handle(new UpgradeAccountCommand(userId.Value), cancellationToken);
                    return result.Match(
                        tier => Results.Ok(new
                        {
                            success = true,
                            message = "Account upgraded to Premium successfully",
                            data = new { accountType = tier.ToString().ToUpperInvariant() }
                        }),
                        CustomResults.Problem);
                })
            .RequireAuthorization()
            .WithName("PostAccountUpgrade")
            .WithTags(AccountEndpointTags.Account);
    }
}
