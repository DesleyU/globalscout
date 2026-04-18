using Aspire.Hosting.ApplicationModel;

var builder = DistributedApplication.CreateBuilder(args);

var postgres = builder.AddPostgres("postgres")
    .WithDataVolume()
    .WithLifetime(ContainerLifetime.Persistent)
    .WithPgAdmin(pgAdmin => pgAdmin.WithLifetime(ContainerLifetime.Persistent));

var globalscoutDb = postgres.AddDatabase("globalscout");

var api = builder.AddProject<Projects.GlobalScout_Api>("globalscout-api")
    .WithExternalHttpEndpoints()
    .WithReference(globalscoutDb)
    .WaitFor(globalscoutDb);

// Use the HTTPS endpoint so the browser talks to the API directly; the HTTP endpoint
// triggers UseHttpsRedirection which breaks CORS preflight (browsers don't follow
// redirects on OPTIONS requests).
var frontend = builder.AddViteApp("frontend", "../../../frontend")
    .WithReference(api)
    .WaitFor(api)
    .WithEnvironment("VITE_API_URL", ReferenceExpression.Create($"{api.GetEndpoint("https")}/api"));

// Aspire allocates a reverse-proxy endpoint for the Vite app (e.g. http(s)://frontend-*.dev.localhost:<port>),
// so the browser's Origin is that URL rather than http://localhost:5173. Inject it into the API as an
// allowed CORS origin so the policy always matches whatever Aspire assigned.
api.WithEnvironment("Cors__AllowedOrigins__0", frontend.GetEndpoint("http"));

builder.Build().Run();
