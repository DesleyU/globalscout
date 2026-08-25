using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.ReferenceData;

namespace GlobalScout.Application.ReferenceData.SubmitTeam;

public sealed record SubmitFootballTeamCommand(
    Guid UserId,
    string Country,
    string Name) : ICommand<FootballTeamDto>;
