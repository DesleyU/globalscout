namespace GlobalScout.Api.Endpoints.Auth;

internal sealed class PostAuthLogout : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost(AuthRoutes.Logout, () => Results.NoContent())
            .AllowAnonymous()
            .WithName("Logout")
            .WithTags(AuthEndpointTags.Authentication);
    }
}
