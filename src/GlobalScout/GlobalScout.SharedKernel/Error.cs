namespace GlobalScout.SharedKernel;

public sealed record Error(
    string Code,
    string Description,
    ErrorType Type = ErrorType.Failure,
    IReadOnlyDictionary<string, object?>? Extensions = null)
{
    public static readonly Error None = new(string.Empty, string.Empty, ErrorType.Failure, null);

    public static Error Validation(string code, string description) =>
        new(code, description, ErrorType.Validation, null);

    public static Error NotFound(string code, string description) =>
        new(code, description, ErrorType.NotFound, null);

    public static Error Conflict(string code, string description) =>
        new(code, description, ErrorType.Conflict, null);

    public static Error Problem(string code, string description) =>
        new(code, description, ErrorType.Problem, null);

    public static Error Forbidden(string code, string description, IReadOnlyDictionary<string, object?>? extensions = null) =>
        new(code, description, ErrorType.Forbidden, extensions);
}
