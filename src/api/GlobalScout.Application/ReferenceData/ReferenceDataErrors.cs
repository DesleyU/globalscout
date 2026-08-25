using GlobalScout.SharedKernel;

namespace GlobalScout.Application.ReferenceData;

public static class ReferenceDataErrors
{
    public static readonly Error ExternalTeamSearchUnavailable =
        Error.Problem(
            "ReferenceData.ExternalTeamSearchUnavailable",
            "Could not search external football team data.");

    public static readonly Error ExternalCountrySyncUnavailable =
        Error.Problem(
            "ReferenceData.ExternalCountrySyncUnavailable",
            "Could not synchronize football reference data from the external provider.");

    public static readonly Error CountryNotSupported =
        Error.Validation(
            "ReferenceData.CountryNotSupported",
            "The country code is not supported.");

    public static readonly Error TooManyPendingSubmissions =
        Error.Conflict(
            "ReferenceData.TooManyPendingSubmissions",
            "You already have the maximum of five pending team or competition submissions.");

    public static readonly Error CompetitionNotFound =
        Error.NotFound(
            "ReferenceData.CompetitionNotFound",
            "Competition not found.");

    public static readonly Error CompetitionLevelRequired =
        Error.Validation(
            "ReferenceData.CompetitionLevelRequired",
            "A competition level is required before approval.");

    public static readonly Error CompetitionTypeRequired =
        Error.Validation(
            "ReferenceData.CompetitionTypeRequired",
            "A competition type is required before approval.");

    public static readonly Error CompetitionNotPendingReview =
        Error.Conflict(
            "ReferenceData.CompetitionNotPendingReview",
            "Only pending user-submitted competitions can be approved or rejected.");
}
