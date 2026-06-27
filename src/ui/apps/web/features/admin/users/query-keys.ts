import type { ListAdminUsersParams } from "@globalscout/shared";

export function serializeAdminUsersFilters(params: ListAdminUsersParams) {
  return {
    role: params.role ?? null,
    status: params.status ?? null,
    search: params.search ?? null,
    page: params.page ?? 1,
    limit: params.limit ?? 20,
  };
}

export function adminUsersFiltersMatch(
  a: ListAdminUsersParams,
  b: ListAdminUsersParams,
): boolean {
  const left = serializeAdminUsersFilters(a);
  const right = serializeAdminUsersFilters(b);
  return (
    left.role === right.role &&
    left.status === right.status &&
    left.search === right.search &&
    left.page === right.page &&
    left.limit === right.limit
  );
}

export const adminUsersQueryKeys = {
  all: ["admin", "users"] as const,
  list: (params: ListAdminUsersParams) =>
    [
      ...adminUsersQueryKeys.all,
      "list",
      serializeAdminUsersFilters(params),
    ] as const,
};
