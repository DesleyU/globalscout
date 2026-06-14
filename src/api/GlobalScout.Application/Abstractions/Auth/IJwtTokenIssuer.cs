namespace GlobalScout.Application.Abstractions.Auth;

public interface IJwtTokenIssuer
{
    string IssueAccessToken(Guid userId, string email, string roleName);
}
