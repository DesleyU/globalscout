using System.Net.Http.Json;
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
    .WithEnvironment("ObjectStorage__CreateBucketIfMissing", "true")
    .WithEnvironment("Email__EndpointUrl", ministack.GetEndpoint("http"))
    .WithEnvironment("Email__Provider", "Ses")
    .WithEnvironment("Email__Region", "us-east-1")
    .WithEnvironment("Email__AccessKey", "test")
    .WithEnvironment("Email__SecretKey", "test")
    .WithEnvironment("AdminSeed__Email", builder.Configuration["AdminSeed:Email"])
    .WithEnvironment("AdminSeed__Password", builder.Configuration["AdminSeed:Password"]);

// Use the HTTPS endpoint so the browser talks to the API directly; the HTTP endpoint
// triggers UseHttpsRedirection which breaks CORS preflight (browsers don't follow
// redirects on OPTIONS requests).
#pragma warning disable ASPIREJAVASCRIPT001
var web = builder.AddNextJsApp("web", "../../ui/apps/web")
    .WithPnpm()
    .WithReference(api)
    .WaitFor(api)
    .WithEnvironment(
        "NEXT_PUBLIC_API_BASE_URL",
        ReferenceExpression.Create($"{api.GetEndpoint("https")}/api"))
    .WithEnvironment("NEXT_PUBLIC_API_ORIGIN", api.GetEndpoint("https"))
    .WithExternalHttpEndpoints();

web.WithEnvironment("ASPIRE_WEB_HTTP_ENDPOINT", web.GetEndpoint("http"));
#pragma warning restore ASPIREJAVASCRIPT001

// Aspire allocates a reverse-proxy endpoint for the Next app (e.g. http(s)://web-*.dev.localhost:<port>),
// so the browser's Origin is that URL rather than http://localhost:3000. Inject it into the API as an
// allowed CORS origin so the policy always matches whatever Aspire assigned.
api.WithEnvironment("Cors__AllowedOrigins__0", web.GetEndpoint("http"));

// The OAuth2 callback's self-submitting form_post page needs the frontend's actual origin to target -
// under Aspire this is a dynamically allocated reverse-proxy endpoint, not a fixed localhost port, so
// it can't come from a static appsettings value (see appsettings.Development.json's fallback for the
// plain `docker compose up` dev path instead).
api.WithEnvironment("Authentication__FrontendBaseUrl", web.GetEndpoint("http"));

// Dashboard buttons for quickly seeding fake, pre-verified test users (api/dev/seed-users is only
// mapped when the API is running in Development, so these are no-ops against a prod build).
AddSeedUsersCommand(api, "PLAYER", "Seed 5 test players", "PersonAdd");
AddSeedUsersCommand(api, "CLUB", "Seed 3 test clubs", "Building");
AddSeedUsersCommand(api, "SCOUT_AGENT", "Seed 3 test agents", "PersonSearch");

builder.Build().Run();

static void AddSeedUsersCommand(IResourceBuilder<ProjectResource> api, string role, string displayName, string iconName) =>
    api.WithHttpCommand(
        path: "/api/dev/seed-users",
        displayName: displayName,
        commandName: $"seed-test-users-{role.ToLowerInvariant()}",
        commandOptions: new HttpCommandOptions
        {
            Method = HttpMethod.Post,
            IconName = iconName,
            Description = $"Creates fake, pre-verified {role} test users via the dev-only seed endpoint.",
            ResultMode = HttpCommandResultMode.Json,
            PrepareRequest = context =>
            {
                context.Request.Content = JsonContent.Create(new { role, count = role == "PLAYER" ? 5 : 3 });
                return Task.CompletedTask;
            }
        });
