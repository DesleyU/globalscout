import type {
  AddLinkEvidenceRequest,
  CreatePlayerIdentityClaimRequest,
  EvidenceType,
  GetMyPlayerIdentityClaimResult,
  PlayerIdentityClaimDto,
  PlayerIdentitySearchRequest,
  SearchPlayersResult,
  VerificationEvidenceDto,
} from "@globalscout/shared";

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

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Could not read file"));
        return;
      }
      const base64 = result.split(",")[1];
      if (!base64) {
        reject(new Error("Could not read file"));
        return;
      }
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

/** Browser-safe player identity API via Next route handlers. */
export function createBrowserPlayerIdentityApi() {
  return {
    searchPlayers(body: PlayerIdentitySearchRequest) {
      return postJson<SearchPlayersResult>("/api/player-identity/search", body);
    },

    createClaim(body: CreatePlayerIdentityClaimRequest) {
      return postJson<PlayerIdentityClaimDto>("/api/player-identity/claims", body);
    },

    getMyClaim() {
      return getJson<GetMyPlayerIdentityClaimResult>(
        "/api/player-identity/claims/me",
      );
    },

    async uploadEvidenceFile(file: File, type: EvidenceType, note?: string | null) {
      const fileBase64 = await fileToBase64(file);
      return postJson<VerificationEvidenceDto>(
        "/api/player-identity/claims/me/evidence/upload",
        {
          fileName: file.name,
          contentType: file.type || "application/octet-stream",
          contentLength: file.size,
          fileBase64,
          type,
          note,
        },
      );
    },

    addLinkEvidence(body: AddLinkEvidenceRequest) {
      return postJson<VerificationEvidenceDto>(
        "/api/player-identity/claims/me/evidence/link",
        body,
      );
    },
  };
}
