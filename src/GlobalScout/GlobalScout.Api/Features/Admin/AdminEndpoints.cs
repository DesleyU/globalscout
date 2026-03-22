namespace GlobalScout.Api.Features.Admin;

public static class AdminEndpoints
{
    public static IEndpointRouteBuilder MapAdminEndpoints(this IEndpointRouteBuilder app)
    {
        _ = app.MapGroup("/api/admin").WithTags("Admin").RequireAuthorization();
        return app;
    }
}
