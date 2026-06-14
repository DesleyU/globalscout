using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Media;

namespace GlobalScout.Application.Media.DeleteVideo;

public sealed class DeleteVideoCommand : ICommand<DeleteVideoResult>
{
    public Guid UserId { get; init; }

    public Guid VideoId { get; init; }
}
