using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Media;

namespace GlobalScout.Application.Media.DeletePhoto;

public sealed class DeletePhotoCommand : ICommand<DeletePhotoResult>
{
    public Guid UserId { get; init; }

    public Guid PhotoId { get; init; }
}
