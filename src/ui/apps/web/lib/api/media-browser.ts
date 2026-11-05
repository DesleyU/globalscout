import type {
  CompletePhotoUploadRequest,
  CompletePhotoUploadResponse,
  CompleteVideoUploadRequest,
  CompleteVideoUploadResponse,
  DeletePhotoResponse,
  DeleteVideoResponse,
  InitiatePhotoUploadRequest,
  InitiatePhotoUploadResult,
  InitiateVideoUploadRequest,
  InitiateVideoUploadResult,
  MediaReadUrlResult,
  MediaVideoListItem,
} from "@globalscout/shared";

type ApiErrorResponse = {
  error?: string;
  message?: string;
  limit?: number;
  current?: number;
};

export class MediaBrowserError extends Error {
  readonly limit?: number;
  readonly current?: number;

  constructor(message: string, options?: { limit?: number; current?: number }) {
    super(message);
    this.name = "MediaBrowserError";
    this.limit = options?.limit;
    this.current = options?.current;
  }
}

async function parseJson<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & ApiErrorResponse;
  if (!response.ok) {
    throw new MediaBrowserError(data.message ?? data.error ?? "Request failed", {
      limit: data.limit,
      current: data.current,
    });
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

async function deleteJson<T>(path: string): Promise<T> {
  const response = await fetch(path, {
    method: "DELETE",
    credentials: "include",
  });
  return parseJson<T>(response);
}

/** Browser-safe media API via Next route handlers. */
export function createBrowserMediaApi() {
  return {
    initiateVideoUpload(body: InitiateVideoUploadRequest) {
      return postJson<InitiateVideoUploadResult>(
        "/api/media/video/upload-url",
        body,
      );
    },

    completeVideoUpload(body: CompleteVideoUploadRequest) {
      return postJson<CompleteVideoUploadResponse>(
        "/api/media/video/complete",
        body,
      );
    },

    getMyVideos() {
      return getJson<MediaVideoListItem[]>("/api/media/videos");
    },

    getMediaUrl(mediaId: string) {
      return getJson<MediaReadUrlResult>(`/api/media/${mediaId}/url`);
    },

    deleteVideo(videoId: string) {
      return deleteJson<DeleteVideoResponse>(`/api/media/video/${videoId}`);
    },

    initiatePhotoUpload(body: InitiatePhotoUploadRequest) {
      return postJson<InitiatePhotoUploadResult>(
        "/api/media/photo/upload-url",
        body,
      );
    },

    completePhotoUpload(body: CompletePhotoUploadRequest) {
      return postJson<CompletePhotoUploadResponse>(
        "/api/media/photo/complete",
        body,
      );
    },

    getMyPhotos() {
      return getJson<MediaVideoListItem[]>("/api/media/photos");
    },

    deletePhoto(photoId: string) {
      return deleteJson<DeletePhotoResponse>(`/api/media/photo/${photoId}`);
    },
  };
}

export type BrowserMediaApi = ReturnType<typeof createBrowserMediaApi>;
