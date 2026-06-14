import type {
  AdminPlayerClaimNoteRequest,
  AdminPlayerClaimRequiredNoteRequest,
  AdminPlayerClaimsListResult,
  ListAdminPlayerClaimsParams,
  PlayerIdentityClaimDto,
  PresignedReadUrlResult,
} from "@globalscout/shared";

function toQueryString(params: ListAdminPlayerClaimsParams): string {
  const search = new URLSearchParams();
  if (params.status) search.set("status", params.status);
  if (params.search) search.set("search", params.search);
  if (params.page !== undefined) search.set("page", String(params.page));
  if (params.limit !== undefined) search.set("limit", String(params.limit));
  const query = search.toString();
  return query ? `?${query}` : "";
}

async function parseJson<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(data.error ?? "Request failed");
  }
  return data;
}

async function postJson<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return parseJson<T>(response);
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(path, {
    credentials: "include",
  });
  return parseJson<T>(response);
}

/** Browser-safe admin API via Next route handlers. */
export function createBrowserAdminApi() {
  return {
    listPlayerClaims(params: ListAdminPlayerClaimsParams = {}) {
      return getJson<AdminPlayerClaimsListResult>(
        `/api/admin/player-claims${toQueryString(params)}`,
      );
    },

    approvePlayerClaim(
      claimId: string,
      body: AdminPlayerClaimNoteRequest = {},
    ) {
      return postJson<PlayerIdentityClaimDto>(
        `/api/admin/player-claims/${claimId}/approve`,
        body,
      );
    },

    rejectPlayerClaim(
      claimId: string,
      body: AdminPlayerClaimRequiredNoteRequest,
    ) {
      return postJson<PlayerIdentityClaimDto>(
        `/api/admin/player-claims/${claimId}/reject`,
        body,
      );
    },

    requestPlayerClaimInfo(
      claimId: string,
      body: AdminPlayerClaimRequiredNoteRequest,
    ) {
      return postJson<PlayerIdentityClaimDto>(
        `/api/admin/player-claims/${claimId}/request-info`,
        body,
      );
    },

    getEvidenceReadUrl(claimId: string, evidenceId: string) {
      return getJson<PresignedReadUrlResult>(
        `/api/admin/player-claims/${claimId}/evidence/${evidenceId}/url`,
      );
    },
  };
}
