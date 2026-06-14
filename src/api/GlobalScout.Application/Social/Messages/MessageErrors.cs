using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Social.Messages;

public static class MessageErrors
{
    public static readonly Error CannotMessageSelf =
        Error.Problem("Messages.CannotMessageSelf", "Cannot send message to yourself.");

    public static readonly Error NotConnected =
        Error.Forbidden("Messages.NotConnected", "You must be connected to send messages.");

    public static readonly Error ReceiverNotFound =
        Error.NotFound("Messages.UserNotFound", "User not found.");
}
