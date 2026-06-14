using FluentValidation;

namespace GlobalScout.Application.Social.Messages.SendMessage;

internal sealed class SendMessageCommandValidator : AbstractValidator<SendMessageCommand>
{
    public SendMessageCommandValidator()
    {
        RuleFor(c => c.ReceiverId).NotEmpty();
        RuleFor(c => c.Content)
            .NotEmpty()
            .MaximumLength(1000);
    }
}
