using GlobalScout.SharedKernel;

namespace GlobalScout.Application.ReferenceData;

public static class ReferenceDataErrors
{
    public static readonly Error ExternalTeamSearchUnavailable =
        Error.Problem(
            "ReferenceData.ExternalTeamSearchUnavailable",
            "Could not search external football team data.");
}
