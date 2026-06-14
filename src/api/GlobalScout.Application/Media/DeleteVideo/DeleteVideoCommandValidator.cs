using FluentValidation;

namespace GlobalScout.Application.Media.DeleteVideo;

internal sealed class DeleteVideoCommandValidator : AbstractValidator<DeleteVideoCommand>
{
    public DeleteVideoCommandValidator()
    {
        RuleFor(c => c.VideoId).NotEmpty();
    }
}
