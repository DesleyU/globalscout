using FluentValidation;

namespace GlobalScout.Application.Media.DeletePhoto;

internal sealed class DeletePhotoCommandValidator : AbstractValidator<DeletePhotoCommand>
{
    public DeletePhotoCommandValidator()
    {
        RuleFor(c => c.PhotoId).NotEmpty();
    }
}
