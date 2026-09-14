using GlobalScout.Application.Abstractions.Auth;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.SharedKernel;
using Microsoft.Extensions.Logging;

namespace GlobalScout.Application.Auth.ExternalLogin;

internal sealed class CompleteExternalLoginCommandHandler(
    IExternalLoginAccessor loginAccessor,
    IExternalIdentityStore identityStore,
    ILogger<CompleteExternalLoginCommandHandler> logger)
    : ICommandHandler<CompleteExternalLoginCommand, CompleteExternalLoginResult>
{
    public const int MinimumAge = 16;

    public async Task<Result<CompleteExternalLoginResult>> Handle(
        CompleteExternalLoginCommand command,
        CancellationToken cancellationToken)
    {
        var info = await loginAccessor.GetExternalLoginInfoAsync(cancellationToken);
        if (info is null)
        {
            logger.LogWarning("External login callback for {Provider} had no external login info.", command.Provider);
            return Result.Failure<CompleteExternalLoginResult>(ExternalLoginErrors.ProviderError);
        }

        // 1. Already-linked provider identity: returning user (User Story 3 / FR-009). Takes priority
        // over everything else - this person already passed the email/age checks when they first linked.
        var existingUserId = await identityStore.FindUserIdByLoginAsync(info.Provider, info.ProviderKey, cancellationToken);
        if (existingUserId is not null)
        {
            logger.LogInformation("External login: {Provider} matched existing linked account.", info.Provider);
            return Result.Success(new CompleteExternalLoginResult(existingUserId.Value, IsNewAccount: false));
        }

        // 2. First-time link attempt: the provider's email matches an existing account (password
        // registration or a different provider). FR-010: only auto-link if the provider confirms the
        // email as verified; otherwise direct the person to their original sign-in method.
        if (!string.IsNullOrWhiteSpace(info.Email))
        {
            var existingByEmail = await identityStore.FindUserIdByEmailAsync(info.Email, cancellationToken);
            if (existingByEmail is not null)
            {
                if (!info.EmailVerified)
                {
                    logger.LogInformation(
                        "External login: {Provider} email matches an existing account but is not provider-verified; rejecting auto-link.",
                        info.Provider);
                    return Result.Failure<CompleteExternalLoginResult>(ExternalLoginErrors.EmailInUse);
                }

                var link = await identityStore.LinkLoginAsync(existingByEmail.Value, info.Provider, info.ProviderKey, cancellationToken);
                if (link.IsFailure)
                {
                    return Result.Failure<CompleteExternalLoginResult>(link.Error);
                }

                logger.LogInformation("External login: {Provider} auto-linked to existing account via verified email.", info.Provider);
                return Result.Success(new CompleteExternalLoginResult(existingByEmail.Value, IsNewAccount: false));
            }
        }

        // 3. No match at all: this is a brand-new account. Enforce the minimum-age gate (FR-011) right
        // before creation - age/DOB is rarely supplied by any provider in practice (see research.md),
        // so this only fires when the provider happens to return it.
        if (IsUnderMinimumAge(info))
        {
            logger.LogInformation("External login: {Provider} reported an under-{MinimumAge} age; blocking account creation.", info.Provider, MinimumAge);
            return Result.Failure<CompleteExternalLoginResult>(ExternalLoginErrors.UnderAge);
        }

        var created = await identityStore.CreateUserWithLoginAsync(info, cancellationToken);
        if (created.IsFailure)
        {
            return Result.Failure<CompleteExternalLoginResult>(created.Error);
        }

        logger.LogInformation("External login: {Provider} created a new account.", info.Provider);
        return Result.Success(new CompleteExternalLoginResult(created.Value, IsNewAccount: true));
    }

    private static bool IsUnderMinimumAge(ExternalLoginInfoDto info)
    {
        if (info.DateOfBirth is { } dob)
        {
            return ComputeAge(dob) < MinimumAge;
        }

        return info.Age is { } age && age < MinimumAge;
    }

    private static int ComputeAge(DateOnly dateOfBirth)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var age = today.Year - dateOfBirth.Year;
        if (dateOfBirth > today.AddYears(-age))
        {
            age--;
        }

        return age;
    }
}
