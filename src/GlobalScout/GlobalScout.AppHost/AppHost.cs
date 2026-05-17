using Aspire.Hosting.ApplicationModel;

var builder = DistributedApplication.CreateBuilder(args);

var postgres = builder.AddPostgres("postgres")
    .WithDataVolume()
    .WithLifetime(ContainerLifetime.Persistent)
    .WithPgAdmin(pgAdmin => pgAdmin.WithLifetime(ContainerLifetime.Persistent));

var globalscoutDb = postgres.AddDatabase("globalscout");

var ministack = builder.AddContainer("ministack", "ministackorg/ministack")
    .WithHttpEndpoint(port: 4566, targetPort: 4566, name: "http")
    .WithLifetime(ContainerLifetime.Persistent);

var api = builder.AddProject<Projects.GlobalScout_Api>("globalscout-api")
    .WithExternalHttpEndpoints()
    .WithReference(globalscoutDb)
    .WaitFor(globalscoutDb)
    .WaitFor(ministack)
    .WithEnvironment("ObjectStorage__EndpointUrl", ministack.GetEndpoint("http"))
    .WithEnvironment("ObjectStorage__BucketName", "globalscout-dev-media")
    .WithEnvironment("ObjectStorage__Region", "us-east-1")
    .WithEnvironment("ObjectStorage__AccessKey", "test")
    .WithEnvironment("ObjectStorage__SecretKey", "test")
    .WithEnvironment("ObjectStorage__ForcePathStyle", "true")
    .WithEnvironment("ObjectStorage__CreateBucketIfMissing", "true");

// Use the HTTPS endpoint so the browser talks to the API directly; the HTTP endpoint
// triggers UseHttpsRedirection which breaks CORS preflight (browsers don't follow
// redirects on OPTIONS requests).
var frontend = builder.AddViteApp("frontend", "../../../frontend")
    .WithReference(api)
    .WaitFor(api)
    .WithEnvironment("VITE_API_BASE_URL", ReferenceExpression.Create($"{api.GetEndpoint("https")}/api"));

// Aspire allocates a reverse-proxy endpoint for the Vite app (e.g. http(s)://frontend-*.dev.localhost:<port>),
// so the browser's Origin is that URL rather than http://localhost:5173. Inject it into the API as an
// allowed CORS origin so the policy always matches whatever Aspire assigned.
api.WithEnvironment("Cors__AllowedOrigins__0", frontend.GetEndpoint("http"));

builder.Build().Run();
