using System.Text.Json.Serialization;
using GlobalScout.Api.Features.Admin;
using GlobalScout.Api.Features.Auth;
using GlobalScout.Api.Features.Users;
using GlobalScout.Application;
using GlobalScout.Infrastructure;
using GlobalScout.Infrastructure.Data;
using GlobalScout.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.ConfigureHttpJsonOptions(o =>
{
    o.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
});

builder.AddServiceDefaults();

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

builder.Services.AddOpenApi(options => options.AddScalarTransformers());

var app = builder.Build();

app.MapDefaultEndpoints();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

if (app.Environment.IsDevelopment() || app.Environment.IsEnvironment("IntegrationTesting"))
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<GlobalScoutDbContext>();
    await db.Database.MigrateAsync();
}

await IdentityDataSeeder.SeedRolesAsync(app.Services);

app.MapAuthEndpoints();
app.MapAdminEndpoints();
app.MapUserEndpoints();

app.Run();
