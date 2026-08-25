import type {
  CompleteAvatarUploadRequest,
  CompleteAvatarUploadResponse,
  InitiateAvatarUploadRequest,
  PresignedReadUrlResult,
  PresignedUploadResult,
} from "@globalscout/shared";

type ApiErrorResponse = {
  error?: string;
  message?: string;
};

async function parseJson<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & ApiErrorResponse;
  if (!response.ok) {
    throw new Error(data.message ?? data.error ?? "Request failed");
  }
  return data;
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(path, {
    credentials: "include",
  });
  return parseJson<T>(response);
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(body),
  });
  return parseJson<T>(response);
}

/** Browser-safe avatar API via Next route handlers. */
export function createBrowserUsersApi() {
  return {
    initiateAvatarUpload(body: InitiateAvatarUploadRequest) {
      return postJson<PresignedUploadResult>(
        "/api/users/avatar/upload-url",
        body,
      );
    },

    completeAvatarUpload(body: CompleteAvatarUploadRequest) {
      return postJson<CompleteAvatarUploadResponse>(
        "/api/users/avatar/complete",
        body,
      );
    },

    getAvatarUrl(userId: string) {
      return getJson<PresignedReadUrlResult>(
        `/api/users/${userId}/avatar/url`,
      );
    },
  };
}

export type BrowserUsersApi = ReturnType<typeof createBrowserUsersApi>;
