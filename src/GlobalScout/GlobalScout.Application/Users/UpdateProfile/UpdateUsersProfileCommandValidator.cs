using FluentValidation;

namespace GlobalScout.Application.Users.UpdateProfile;

internal sealed class UpdateUsersProfileCommandValidator : AbstractValidator<UpdateUsersProfileCommand>
{
    public UpdateUsersProfileCommandValidator()
    {
        RuleFor(c => c.FirstName)
            .MaximumLength(100)
            .When(c => c.FirstName is not null);

        RuleFor(c => c.LastName)
            .MaximumLength(100)
            .When(c => c.LastName is not null);

        RuleFor(c => c.PlayerId)
            .Must(v => v is null || v.Length == 0 || int.TryParse(v, out _))
            .WithMessage("PlayerId must be a number or empty string.");
    }
}
