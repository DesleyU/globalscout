using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Application.Social;
using GlobalScout.Application.Subscriptions;
using GlobalScout.Domain.Identity;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Social.SendConnection;

internal sealed class SendConnectionRequestCommandHandler(ISocialGraphRepository social)
    : ICommandHandler<SendConnectionRequestCommand, SendConnectionResponseDto>
{
    public async Task<Result<SendConnectionResponseDto>> Handle(
        SendConnectionRequestCommand command,
        CancellationToken cancellationToken)
    {
        if (command.SenderId == command.ReceiverId)
        {
            return Result.Failure<SendConnectionResponseDto>(SocialErrors.CannotConnectToSelf);
        }

        if (!await social.IsActiveUserAsync(command.ReceiverId, cancellationToken))
        {
            return Result.Failure<SendConnectionResponseDto>(SocialErrors.UserNotFound);
        }

        var accountType = await social.GetAccountTypeAsync(command.SenderId, cancellationToken);
        if (accountType is AccountType.Basic)
        {
            var count = await social.CountAcceptedConnectionsAsync(command.SenderId, cancellationToken);
            if (count >= SubscriptionLimits.BasicMaxConnections)
            {
                return Result.Failure<SendConnectionResponseDto>(
                    SocialErrors.ConnectionLimitReached(count));
            }
        }

        if (await social.ConnectionExistsAsync(command.SenderId, command.ReceiverId, cancellationToken))
        {
            return Result.Failure<SendConnectionResponseDto>(SocialErrors.ConnectionAlreadyExists);
        }

        if (await social.ConnectionExistsAsync(command.ReceiverId, command.SenderId, cancellationToken))
        {
            return Result.Failure<SendConnectionResponseDto>(SocialErrors.ConnectionReverseExists);
        }

        var created = await social.CreateConnectionAsync(
            command.SenderId,
            command.ReceiverId,
            command.Message,
            cancellationToken);

        if (created is null)
        {
            return Result.Failure<SendConnectionResponseDto>(SocialErrors.ConnectionAlreadyExists);
        }

        return Result.Success(created);
    }
}
