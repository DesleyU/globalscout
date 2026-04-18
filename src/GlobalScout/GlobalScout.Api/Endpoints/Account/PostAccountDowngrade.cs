using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Account.DowngradeAccount;
using GlobalScout.Domain.Identity;
using GlobalScout.SharedKernel;

namespace GlobalScout.Api.Endpoints.Account;

internal sealed class PostAccountDowngrade : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost(
                AccountRoutes.Downgrade,
                async (
                    ClaimsPrincipal user,
                    ICommandHandler<DowngradeAccountCommand, AccountType> handler,
                    CancellationToken cancellationToken) =>
                {
                    var userId = HttpUser.ResolveId(user);
                    if (userId is null)
                    {
                        return Results.Unauthorized();
                    }

                    var result = await handler.Handle(new DowngradeAccountCommand(userId.Value), cancellationToken);
                    return result.Match(
                        tier => Results.Ok(new
                        {
                            success = true,
                            message = "Account downgraded to Basic",
                            data = new { accountType = tier.ToString().ToUpperInvariant() }
                        }),
                        CustomResults.Problem);
                })
            .RequireAuthorization()
            .WithName("PostAccountDowngrade")
            .WithTags(AccountEndpointTags.Account);
    }
}
