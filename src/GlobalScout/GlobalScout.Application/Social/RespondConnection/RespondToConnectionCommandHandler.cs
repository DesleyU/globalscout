using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Application.Social;
using GlobalScout.Domain.Social;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Social.RespondConnection;

internal sealed class RespondToConnectionCommandHandler(ISocialGraphRepository social)
    : ICommandHandler<RespondToConnectionCommand, RespondToConnectionResponseDto>
{
    public async Task<Result<RespondToConnectionResponseDto>> Handle(
        RespondToConnectionCommand command,
        CancellationToken cancellationToken)
    {
        var status = command.Action.Trim().Equals("accept", StringComparison.OrdinalIgnoreCase)
            ? ConnectionStatus.Accepted
            : ConnectionStatus.Rejected;

        var updated = await social.RespondToPendingConnectionAsync(
            command.ConnectionId,
            command.ReceiverId,
            status,
            cancellationToken);

        if (updated is null)
        {
            return Result.Failure<RespondToConnectionResponseDto>(SocialErrors.ConnectionRequestNotFound);
        }

        return Result.Success(updated);
    }
}
