import type { ListAdminUsersParams } from "@globalscout/shared";

export const DEFAULT_ADMIN_USERS_FILTERS: ListAdminUsersParams = {
  page: 1,
  limit: 20,
};

export const ADMIN_USER_ROLE_FILTER_OPTIONS = [
  { value: "all", label: "All roles" },
  { value: "PLAYER", label: "Player" },
  { value: "CLUB", label: "Club" },
  { value: "SCOUT_AGENT", label: "Scout" },
  { value: "ADMIN", label: "Admin" },
  { value: "PENDING", label: "Pending" },
] as const;

export const ADMIN_USER_STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "BLOCKED", label: "Blocked" },
  { value: "PENDING", label: "Pending" },
] as const;

export const ADMIN_USERS_PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

export function toUserRoleFilter(
  value: string | null | undefined,
): string | undefined {
  if (!value || value === "all") {
    return undefined;
  }

  return value;
}

export function fromUserRoleFilter(role: string | undefined): string {
  return role ?? "all";
}

export function toUserStatusFilter(
  value: string | null | undefined,
): string | undefined {
  if (!value || value === "all") {
    return undefined;
  }

  return value;
}

export function fromUserStatusFilter(status: string | undefined): string {
  return status ?? "all";
}
