using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Social.Messages;

public static class MessagingErrors
{
    public static readonly Error CannotMessageSelf =
        Error.Problem("Messaging.CannotMessageSelf", "Cannot send message to yourself.");

    public static readonly Error NotConnected =
        Error.Forbidden("Messaging.NotConnected", "You must be connected to send messages.");

    public static readonly Error ReceiverNotFound =
        Error.NotFound("Messaging.UserNotFound", "User not found.");
}
