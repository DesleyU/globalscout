using FluentValidation;

namespace GlobalScout.Application.Social.Connections.SendConnection;

internal sealed class SendConnectionRequestCommandValidator : AbstractValidator<SendConnectionRequestCommand>
{
    public SendConnectionRequestCommandValidator()
    {
        RuleFor(c => c.ReceiverId).NotEmpty();
    }
}
