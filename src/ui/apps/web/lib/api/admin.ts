import {
  adminPaths,
  type AdminPlayerClaimNoteRequest,
  type AdminPlayerClaimRequiredNoteRequest,
  type AdminPlayerClaimsListResult,
  type AdminSystemStatsResult,
  type AdminUserStatusSummary,
  type AdminUsersListResult,
  type ApiTransport,
  type DeleteAdminUserResponse,
  type ListAdminPlayerClaimsParams,
  type ListAdminUsersParams,
  type PlayerIdentityClaimDto,
  type PresignedReadUrlResult,
} from "@globalscout/shared";

function toQueryString(
  params: ListAdminUsersParams | ListAdminPlayerClaimsParams,
): string {
  const search = new URLSearchParams();
  if ("role" in params && params.role) search.set("role", params.role);
  if (params.status) search.set("status", params.status);
  if (params.search) search.set("search", params.search);
  if (params.page !== undefined) search.set("page", String(params.page));
  if (params.limit !== undefined) search.set("limit", String(params.limit));
  const query = search.toString();
  return query ? `?${query}` : "";
}

export function createAdminApi(client: ApiTransport) {
  return {
    getUsers(params: ListAdminUsersParams = {}) {
      return client.get<AdminUsersListResult>(
        `${adminPaths.users}${toQueryString(params)}`,
      );
    },

    updateUserStatus(userId: string, status: string) {
      return client.put<AdminUserStatusSummary>(
        adminPaths.userStatus(userId),
        { status },
      );
    },

    deleteUser(userId: string) {
      return client.delete<DeleteAdminUserResponse>(
        adminPaths.userById(userId),
      );
    },

    getStats() {
      return client.get<AdminSystemStatsResult>(adminPaths.stats);
    },

    listPlayerClaims(params: ListAdminPlayerClaimsParams = {}) {
      return client.get<AdminPlayerClaimsListResult>(
        `${adminPaths.playerClaims}${toQueryString(params)}`,
      );
    },

    approvePlayerClaim(claimId: string, body: AdminPlayerClaimNoteRequest = {}) {
      return client.post<PlayerIdentityClaimDto>(
        adminPaths.playerClaimApprove(claimId),
        body,
      );
    },

    rejectPlayerClaim(
      claimId: string,
      body: AdminPlayerClaimRequiredNoteRequest,
    ) {
      return client.post<PlayerIdentityClaimDto>(
        adminPaths.playerClaimReject(claimId),
        body,
      );
    },

    requestPlayerClaimInfo(
      claimId: string,
      body: AdminPlayerClaimRequiredNoteRequest,
    ) {
      return client.post<PlayerIdentityClaimDto>(
        adminPaths.playerClaimRequestInfo(claimId),
        body,
      );
    },

    getEvidenceReadUrl(claimId: string, evidenceId: string) {
      return client.get<PresignedReadUrlResult>(
        adminPaths.playerClaimEvidenceReadUrl(claimId, evidenceId),
      );
    },
  };
}

export type AdminApi = ReturnType<typeof createAdminApi>;
