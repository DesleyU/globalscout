using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.ReferenceData;
using GlobalScout.Domain.ReferenceData;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.ReferenceData.Admin.ReviewCompetition;

internal sealed class ReviewCompetitionSubmissionCommandHandler(IReferenceDataCatalog catalog)
    : ICommandHandler<ReviewCompetitionSubmissionCommand, AdminFootballCompetitionDto>
{
    public async Task<Result<AdminFootballCompetitionDto>> Handle(
        ReviewCompetitionSubmissionCommand command,
        CancellationToken cancellationToken)
    {
        var existing = await catalog.TryGetCompetitionForReviewByIdAsync(
            command.CompetitionId,
            cancellationToken);
        if (existing is null)
        {
            return Result.Failure<AdminFootballCompetitionDto>(ReferenceDataErrors.CompetitionNotFound);
        }

        if (existing.Status != ReferenceDataStatus.Pending)
        {
            return Result.Failure<AdminFootballCompetitionDto>(
                ReferenceDataErrors.CompetitionNotPendingReview);
        }

        if (command.Approve)
        {
            if (command.Level is null || command.Level == CompetitionLevel.Unknown)
            {
                return Result.Failure<AdminFootballCompetitionDto>(
                    ReferenceDataErrors.CompetitionLevelRequired);
            }

            if (command.Type is null)
            {
                return Result.Failure<AdminFootballCompetitionDto>(
                    ReferenceDataErrors.CompetitionTypeRequired);
            }

            var approved = await catalog.ReviewCompetitionAsync(
                command.CompetitionId,
                ReferenceDataStatus.Approved,
                command.Level,
                command.Type,
                cancellationToken);

            return approved is null
                ? Result.Failure<AdminFootballCompetitionDto>(ReferenceDataErrors.CompetitionNotFound)
                : Result.Success(approved);
        }

        var rejected = await catalog.ReviewCompetitionAsync(
            command.CompetitionId,
            ReferenceDataStatus.Rejected,
            level: null,
            type: null,
            cancellationToken);

        return rejected is null
            ? Result.Failure<AdminFootballCompetitionDto>(ReferenceDataErrors.CompetitionNotFound)
            : Result.Success(rejected);
    }
}
