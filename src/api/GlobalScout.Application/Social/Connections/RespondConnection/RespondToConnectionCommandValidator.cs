using FluentValidation;

namespace GlobalScout.Application.Social.Connections.RespondConnection;

internal sealed class RespondToConnectionCommandValidator : AbstractValidator<RespondToConnectionCommand>
{
    public RespondToConnectionCommandValidator()
    {
        RuleFor(c => c.ConnectionId).NotEmpty();
        RuleFor(c => c.Action)
            .NotEmpty()
            .Must(a =>
                a.Equals("accept", StringComparison.OrdinalIgnoreCase)
                || a.Equals("reject", StringComparison.OrdinalIgnoreCase))
            .WithMessage("Invalid action. Use \"accept\" or \"reject\".");
    }
}
