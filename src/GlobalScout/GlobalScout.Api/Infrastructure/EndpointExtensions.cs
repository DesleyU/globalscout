using System.Reflection;
using GlobalScout.Api.Endpoints;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace GlobalScout.Api.Infrastructure;

public static class EndpointExtensions
{
    public static IServiceCollection AddEndpoints(this IServiceCollection services, Assembly assembly)
    {
        ServiceDescriptor[] descriptors = assembly
            .DefinedTypes
            .Where(t => t is { IsAbstract: false, IsInterface: false } && t.IsAssignableTo(typeof(IEndpoint)))
            .Select(t => ServiceDescriptor.Transient(typeof(IEndpoint), t))
            .ToArray();

        services.TryAddEnumerable(descriptors);
        return services;
    }

    public static IEndpointRouteBuilder MapEndpoints(this IEndpointRouteBuilder builder, IServiceProvider services)
    {
        foreach (var endpoint in services.GetRequiredService<IEnumerable<IEndpoint>>())
        {
            endpoint.MapEndpoint(builder);
        }

        return builder;
    }

    /// <summary>Maps all registered <see cref="IEndpoint"/> implementations (same pattern as clean-architecture <c>app.MapEndpoints()</c>).</summary>
    public static WebApplication MapEndpoints(this WebApplication app)
    {
        app.MapEndpoints(app.Services);
        return app;
    }
}
