using GlobalScout.SharedKernel;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace GlobalScout.Api.Infrastructure;

public static class CustomResults
{
    public static ProblemHttpResult Problem(Error error)
    {
        var statusCode = error.Type switch
        {
            ErrorType.Validation => StatusCodes.Status400BadRequest,
            ErrorType.NotFound => StatusCodes.Status404NotFound,
            ErrorType.Conflict => StatusCodes.Status409Conflict,
            ErrorType.Problem => StatusCodes.Status400BadRequest,
            ErrorType.Forbidden => StatusCodes.Status403Forbidden,
            _ => StatusCodes.Status400BadRequest
        };

        var extensions = new Dictionary<string, object?> { ["code"] = error.Code };
        if (error.Extensions is not null)
        {
            foreach (KeyValuePair<string, object?> kv in error.Extensions)
            {
                extensions[kv.Key] = kv.Value;
            }
        }

        return TypedResults.Problem(
            title: GetTitle(error.Type),
            detail: error.Description,
            statusCode: statusCode,
            type: $"https://httpstatuses.com/{statusCode}",
            extensions: extensions);
    }

    private static string GetTitle(ErrorType type) =>
        type switch
        {
            ErrorType.Validation => "Validation error",
            ErrorType.NotFound => "Not found",
            ErrorType.Conflict => "Conflict",
            ErrorType.Problem => "Bad request",
            ErrorType.Forbidden => "Forbidden",
            _ => "Error"
        };
}
