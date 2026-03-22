using System.Text.Json;
using System.Text.Json.Serialization;
using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Users;
using GlobalScout.Application.Users.UpdateProfile;
using GlobalScout.SharedKernel;

namespace GlobalScout.Api.Endpoints.Users;

internal sealed class PutUsersProfile : IEndpoint
{
    public sealed class Request
    {
        public string? PlayerId { get; set; }

        public string? FirstName { get; set; }

        public string? LastName { get; set; }

        public string? Bio { get; set; }

        public string? Position { get; set; }

        public int? Age { get; set; }

        public int? Height { get; set; }

        public int? Weight { get; set; }

        public string? Nationality { get; set; }

        public string? ClubName { get; set; }

        public string? ClubLogo { get; set; }

        public string? Phone { get; set; }

        public string? Website { get; set; }

        public string? Instagram { get; set; }

        public string? Twitter { get; set; }

        public string? Linkedin { get; set; }

        public string? Country { get; set; }

        public string? City { get; set; }

        [JsonPropertyName("statsData")]
        public JsonElement? StatsData { get; set; }
    }

    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPut(
                UsersRoutes.Profile,
                async (
                    ClaimsPrincipal principal,
                    Request body,
                    ICommandHandler<UpdateUsersProfileCommand, UsersFullProfileResult> handler,
                    CancellationToken cancellationToken) =>
                {
                    var userId = HttpUser.ResolveId(principal);
                    if (userId is null)
                    {
                        return Results.Unauthorized();
                    }

                    string? statsJson = body.StatsData is { ValueKind: not JsonValueKind.Undefined and not JsonValueKind.Null } e
                        ? e.GetRawText()
                        : null;

                    var command = new UpdateUsersProfileCommand
                    {
                        UserId = userId.Value,
                        PlayerId = body.PlayerId,
                        FirstName = body.FirstName,
                        LastName = body.LastName,
                        Bio = body.Bio,
                        Position = body.Position,
                        Age = body.Age,
                        Height = body.Height,
                        Weight = body.Weight,
                        Nationality = body.Nationality,
                        ClubName = body.ClubName,
                        ClubLogo = body.ClubLogo,
                        Phone = body.Phone,
                        Website = body.Website,
                        Instagram = body.Instagram,
                        Twitter = body.Twitter,
                        Linkedin = body.Linkedin,
                        Country = body.Country,
                        City = body.City,
                        StatsDataJson = statsJson
                    };

                    var result = await handler.Handle(command, cancellationToken);

                    return result.Match(Results.Ok, CustomResults.Problem);
                })
            .RequireAuthorization()
            .WithName("PutUsersProfile")
            .WithTags(UsersEndpointTags.Users);
    }
}
