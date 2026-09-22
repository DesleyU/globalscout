using GlobalScout.Application.Abstractions.ReferenceData;
using GlobalScout.Domain.Identity;
using GlobalScout.Domain.ReferenceData;
using GlobalScout.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;

namespace GlobalScout.Api.IntegrationTests.Stats;

internal static class StatsIntegrationTestHelpers
{
    public static async Task SetAccountTypeAsync(
        WebApplicationFactory<Program> factory,
        Guid userId,
        AccountType accountType,
        CancellationToken cancellationToken)
    {
        using var scope = factory.Services.CreateScope();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        ApplicationUser? user = await userManager.FindByIdAsync(userId.ToString());
        if (user is null)
        {
            throw new InvalidOperationException("User not found.");
        }

        user.AccountType = accountType;
        IdentityResult update = await userManager.UpdateAsync(user);
        if (!update.Succeeded)
        {
            throw new InvalidOperationException(string.Join(", ", update.Errors.Select(e => e.Description)));
        }
    }

    public static async Task<(Guid TeamCatalogId, Guid CompetitionCatalogId)> CreateCatalogReferencesAsync(
        WebApplicationFactory<Program> factory,
        Guid submittedByUserId,
        CancellationToken cancellationToken)
    {
        using var scope = factory.Services.CreateScope();
        var catalog = scope.ServiceProvider.GetRequiredService<IReferenceDataCatalog>();

        var team = await catalog.TrySubmitTeamAsync(
            "RO",
            $"Test Team {Guid.NewGuid():N}",
            submittedByUserId,
            5,
            cancellationToken);
        var competition = await catalog.TrySubmitCompetitionAsync(
            "RO",
            $"Test League {Guid.NewGuid():N}",
            CompetitionLevel.Amateur,
            CompetitionType.League,
            submittedByUserId,
            5,
            cancellationToken);

        if (team is null || competition is null)
        {
            throw new InvalidOperationException("Failed to create reference data for stats test.");
        }

        return (team.Id, competition.Id);
    }
}
