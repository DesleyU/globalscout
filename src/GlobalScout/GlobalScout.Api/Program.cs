using System.Reflection;
using System.Text.Json.Serialization;
using GlobalScout.Api.Hubs;
using GlobalScout.Api.Infrastructure;
using GlobalScout.Api.RealTime;
using GlobalScout.Application;
using GlobalScout.Application.Abstractions.RealTime;
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
builder.Services.AddGlobalScoutAvatarStorage(
    builder.Configuration,
    builder.Environment.ContentRootPath,
    builder.Environment.WebRootPath);

builder.Services.AddOpenApi(options => options.AddScalarTransformers());

builder.Services.AddEndpoints(Assembly.GetExecutingAssembly());
builder.Services.AddSignalR();
builder.Services.AddScoped<IMessageRealtimeNotifier, SignalRMessageNotifier>();

var app = builder.Build();

app.MapDefaultEndpoints();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.UseHttpsRedirection();

app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

app.MapHub<MessageHub>("/hubs/messages");

if (app.Environment.IsDevelopment() || app.Environment.IsEnvironment("IntegrationTesting"))
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<GlobalScoutDbContext>();
    await db.Database.MigrateAsync();
}

await IdentityDataSeeder.SeedRolesAsync(app.Services);

app.MapEndpoints();

app.Run();
