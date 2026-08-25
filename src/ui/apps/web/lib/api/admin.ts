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
  type SyncCountryReferenceDataResult,
} from "@globalscout/shared";
import type {
  AdminFootballCompetition,
  ListAdminCountryCompetitionsResult,
  ListAdminReferenceDataCountriesResult,
} from "@/lib/api/reference-data-types";

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

    syncCountryReferenceData(countryCode: string) {
      return client.post<SyncCountryReferenceDataResult>(
        adminPaths.referenceDataSync(countryCode),
      );
    },

    getReferenceDataCountries() {
      return client.get<ListAdminReferenceDataCountriesResult>(
        adminPaths.referenceDataCountries,
      );
    },

    getReferenceDataCountryCompetitions(countryCode: string) {
      return client.get<ListAdminCountryCompetitionsResult>(
        adminPaths.referenceDataCountryCompetitions(countryCode),
      );
    },

    setReferenceDataCompetitionLevel(
      competitionId: string,
      body: { level: string },
    ) {
      return client.put<AdminFootballCompetition>(
        adminPaths.referenceDataCompetitionLevel(competitionId),
        body,
      );
    },

    setReferenceDataCompetitionType(
      competitionId: string,
      body: { type: string },
    ) {
      return client.put<AdminFootballCompetition>(
        adminPaths.referenceDataCompetitionType(competitionId),
        body,
      );
    },

    approveReferenceDataCompetition(
      competitionId: string,
      body: { level: string; type: string },
    ) {
      return client.post<AdminFootballCompetition>(
        adminPaths.referenceDataCompetitionApproval(competitionId),
        body,
      );
    },

    rejectReferenceDataCompetition(competitionId: string) {
      return client.post<AdminFootballCompetition>(
        adminPaths.referenceDataCompetitionRejection(competitionId),
      );
    },
  };
}

export type AdminApi = ReturnType<typeof createAdminApi>;
