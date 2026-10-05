using FluentValidation;

namespace GlobalScout.Application.Social.Messages.SendMessage;

internal sealed class SendMessageCommandValidator : AbstractValidator<SendMessageCommand>
{
    public SendMessageCommandValidator()
    {
        RuleFor(c => c.ReceiverId).NotEmpty();
        RuleFor(c => c.Content)
            .Must(content => !string.IsNullOrWhiteSpace(content))
            .WithMessage("Message content cannot be empty.")
            .MaximumLength(1000);
    }
}
