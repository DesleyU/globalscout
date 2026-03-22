var builder = DistributedApplication.CreateBuilder(args);

var postgres = builder.AddPostgres("postgres")
    .WithDataVolume()
    .WithPgAdmin(_ => { });

var globalscoutDb = postgres.AddDatabase("globalscout");

builder.AddProject<Projects.GlobalScout_Api>("globalscout-api")
    .WithReference(globalscoutDb)
    .WaitFor(globalscoutDb);

builder.Build().Run();
