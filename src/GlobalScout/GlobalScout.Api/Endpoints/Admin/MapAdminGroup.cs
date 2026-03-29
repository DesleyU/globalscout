namespace GlobalScout.Api.Endpoints.Admin;

internal sealed class MapAdminGroup : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        _ = app.MapGroup(AdminRoutes.Base).WithTags(AdminEndpointTags.Admin).RequireAuthorization();
    }
}
