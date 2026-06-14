import {
  playerIdentityPaths,
  type AddLinkEvidenceRequest,
  type ApiTransport,
  type CompleteEvidenceUploadRequest,
  type CreatePlayerIdentityClaimRequest,
  type GetMyPlayerIdentityClaimResult,
  type InitiateEvidenceUploadRequest,
  type InitiateEvidenceUploadResult,
  type PlayerIdentityClaimDto,
  type PlayerIdentitySearchRequest,
  type SearchPlayersResult,
  type VerificationEvidenceDto,
} from "@globalscout/shared";

export function createPlayerIdentityApi(client: ApiTransport) {
  return {
    searchPlayers(body: PlayerIdentitySearchRequest) {
      return client.post<SearchPlayersResult>(playerIdentityPaths.search, body);
    },

    createClaim(body: CreatePlayerIdentityClaimRequest) {
      return client.post<PlayerIdentityClaimDto>(
        playerIdentityPaths.claims,
        body,
      );
    },

    getMyClaim() {
      return client.get<GetMyPlayerIdentityClaimResult>(
        playerIdentityPaths.claimsMe,
      );
    },

    initiateEvidenceUpload(body: InitiateEvidenceUploadRequest) {
      return client.post<InitiateEvidenceUploadResult>(
        playerIdentityPaths.evidenceUploadUrl,
        body,
      );
    },

    completeEvidenceUpload(body: CompleteEvidenceUploadRequest) {
      return client.post<VerificationEvidenceDto>(
        playerIdentityPaths.evidenceComplete,
        body,
      );
    },

    addLinkEvidence(body: AddLinkEvidenceRequest) {
      return client.post<VerificationEvidenceDto>(
        playerIdentityPaths.evidenceLink,
        body,
      );
    },
  };
}

export type PlayerIdentityApi = ReturnType<typeof createPlayerIdentityApi>;
