import type { ListAdminPlayerClaimsParams } from "@globalscout/shared";

export function serializePlayerClaimsFilters(
  params: ListAdminPlayerClaimsParams,
) {
  return {
    status: params.status ?? null,
    search: params.search ?? null,
    page: params.page ?? 1,
    limit: params.limit ?? 20,
  };
}

export function playerClaimsFiltersMatch(
  a: ListAdminPlayerClaimsParams,
  b: ListAdminPlayerClaimsParams,
): boolean {
  const left = serializePlayerClaimsFilters(a);
  const right = serializePlayerClaimsFilters(b);
  return (
    left.status === right.status &&
    left.search === right.search &&
    left.page === right.page &&
    left.limit === right.limit
  );
}

export const playerClaimsQueryKeys = {
  all: ["admin", "player-claims"] as const,
  list: (params: ListAdminPlayerClaimsParams) =>
    [
      ...playerClaimsQueryKeys.all,
      "list",
      serializePlayerClaimsFilters(params),
    ] as const,
};
