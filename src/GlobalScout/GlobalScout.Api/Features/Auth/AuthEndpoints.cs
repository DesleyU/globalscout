using System.Security.Claims;
using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.SharedKernel;
using GlobalScout.Application.Auth.GetProfile;
using GlobalScout.Application.Auth.Login;
using GlobalScout.Application.Auth.Register;
using Microsoft.AspNetCore.Mvc;

namespace GlobalScout.Api.Features.Auth;

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/auth").WithTags("Authentication");

        group.MapPost("/register", RegisterAsync)
            .AllowAnonymous()
            .WithName("Register");

        group.MapPost("/login", LoginAsync)
            .AllowAnonymous()
            .WithName("Login");

        group.MapGet("/profile", GetProfileAsync)
            .RequireAuthorization()
            .WithName("GetAuthProfile");

        return app;
    }

    private static async Task<IResult> RegisterAsync(
        [FromBody] RegisterUserCommand command,
        ICommandHandler<RegisterUserCommand, RegisterUserResult> handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.Handle(command, cancellationToken);

        return result.Match(
            r => Results.Created(
                $"/api/users/{r.UserId}",
                new
                {
                    message = "User registered successfully",
                    token = r.Token,
                    user = new { id = r.UserId, email = r.Email, role = r.Role, profile = r.Profile }
                }),
            CustomResults.Problem);
    }

    private static async Task<IResult> LoginAsync(
        [FromBody] LoginUserCommand command,
        ICommandHandler<LoginUserCommand, LoginUserResult> handler,
        CancellationToken cancellationToken)
    {
        var result = await handler.Handle(command, cancellationToken);

        return result.Match(
            r => Results.Ok(new
            {
                message = "Login successful",
                token = r.Token,
                user = new
                {
                    id = r.UserId,
                    email = r.Email,
                    role = r.Role,
                    accountType = r.AccountType,
                    profile = r.Profile
                }
            }),
            CustomResults.Problem);
    }

    private static async Task<IResult> GetProfileAsync(
        ClaimsPrincipal principal,
        IQueryHandler<GetAuthProfileQuery, GetAuthProfileResult> handler,
        CancellationToken cancellationToken)
    {
        var sub = principal.FindFirstValue(ClaimTypes.NameIdentifier)
                  ?? principal.FindFirstValue("sub");
        if (sub is null || !Guid.TryParse(sub, out var userId))
        {
            return Results.Unauthorized();
        }

        var result = await handler.Handle(new GetAuthProfileQuery(userId), cancellationToken);

        return result.Match(
            r => Results.Ok(new
            {
                user = new
                {
                    id = r.Id,
                    email = r.Email,
                    role = r.Role,
                    status = r.Status.ToString().ToUpperInvariant(),
                    accountType = r.AccountType.ToString().ToUpperInvariant(),
                    profile = r.Profile
                }
            }),
            CustomResults.Problem);
    }
}
