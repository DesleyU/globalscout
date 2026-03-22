namespace GlobalScout.Application.Users;

public sealed record SearchUsersResult(
    IReadOnlyList<SearchUserItem> Users,
    SearchUsersPagination Pagination);

public sealed record SearchUserItem(Guid Id, string Role, string AccountType, UserProfileApiDto? Profile);

public sealed record SearchUsersPagination(int Page, int Limit, int Total, int Pages);
