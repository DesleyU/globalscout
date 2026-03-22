using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Users.Queries.GetUserById;
using GlobalScout.SharedKernel;
using Microsoft.AspNetCore.Mvc;

namespace GlobalScout.Api.Features.Users;

public static class UserEndpoints
{
    public static IEndpointRouteBuilder MapUserEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/users").WithTags("Users");

        group.MapGet("/{id:guid}", GetByIdAsync)
            .WithName("GetUserById");

        return app;
    }

    private static async Task<IResult> GetByIdAsync(
        [FromRoute] Guid id,
        IQueryHandler<GetUserByIdQuery, GetUserByIdResult?> handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.Handle(new GetUserByIdQuery(id), cancellationToken);

        return result.Match(
            user => user is null ? Results.NotFound() : Results.Ok(user),
            GlobalScout.Api.Infrastructure.CustomResults.Problem);
    }
}
