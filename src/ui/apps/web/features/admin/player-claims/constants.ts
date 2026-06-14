import type { ListAdminPlayerClaimsParams } from "@globalscout/shared";

export const DEFAULT_PLAYER_CLAIMS_FILTERS: ListAdminPlayerClaimsParams = {
  page: 1,
  limit: 20,
};

export const PLAYER_CLAIM_STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "Claimed", label: "Claimed" },
  { value: "PendingVerification", label: "Pending verification" },
  { value: "Verified", label: "Verified" },
  { value: "Rejected", label: "Rejected" },
] as const;

export function toClaimStatusFilter(
  value: string | null | undefined,
): string | undefined {
  if (!value || value === "all") {
    return undefined;
  }

  return value;
}

export function fromClaimStatusFilter(status: string | undefined): string {
  return status ?? "all";
}

export const PLAYER_CLAIMS_PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
