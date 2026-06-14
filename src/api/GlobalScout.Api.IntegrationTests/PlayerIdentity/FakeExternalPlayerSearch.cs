using GlobalScout.Application.Abstractions.PlayerIdentity;

using GlobalScout.SharedKernel;



namespace GlobalScout.Api.IntegrationTests.PlayerIdentity;



internal sealed class FakeExternalPlayerSearch(int externalPlayerId) : IExternalPlayerSearch

{

    public int ExternalPlayerId { get; } = externalPlayerId;



    public PlayerSearchCriteria? LastCriteria { get; private set; }



    public Task<Result<IReadOnlyList<ExternalPlayerCandidate>>> SearchAsync(

        PlayerSearchCriteria criteria,

        CancellationToken cancellationToken)

    {

        LastCriteria = criteria;



        IReadOnlyList<ExternalPlayerCandidate> candidates =

        [

            new(

                ExternalPlayerId,

                ExternalPlayerProviders.ApiFootball,

                "Pedri",

                "Gonzalez",

                "Pedri Gonzalez",

                criteria.CurrentClub,

                "Midfielder",

                "Spain",

                22,

                new DateOnly(2003, 4, 12),

                null,

                PreviousClub: "Las Palmas",

                League: "La Liga")

        ];



        return Task.FromResult(Result.Success(candidates));

    }

}
