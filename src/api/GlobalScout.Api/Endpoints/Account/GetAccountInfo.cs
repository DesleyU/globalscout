using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Account.GetAccountInfo;
using GlobalScout.SharedKernel;

namespace GlobalScout.Api.Endpoints.Account;

internal sealed class GetAccountInfo : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet(
                AccountRoutes.Info,
                async (
                    ClaimsPrincipal user,
                    IQueryHandler<GetAccountInfoQuery, GetAccountInfoResult> handler,
                    CancellationToken cancellationToken) =>
                {
                    var userId = HttpUser.ResolveId(user);
                    if (userId is null)
                    {
                        return Results.Unauthorized();
                    }

                    var result = await handler.Handle(new GetAccountInfoQuery(userId.Value), cancellationToken);
                    return result.Match(
                        r => Results.Ok(new
                        {
                            success = true,
                            data = new
                            {
                                id = r.Id,
                                email = r.Email,
                                accountType = r.AccountType,
                                createdAt = r.CreatedAt,
                                limits = r.Limits
                            }
                        }),
                        CustomResults.Problem);
                })
            .RequireAuthorization()
            .WithName("GetAccountInfo")
            .WithTags(AccountEndpointTags.Account);
    }
}
