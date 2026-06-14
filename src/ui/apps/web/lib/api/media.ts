import {
  mediaPaths,
  type ApiTransport,
  type CompleteVideoUploadRequest,
  type CompleteVideoUploadResponse,
  type DeleteVideoResponse,
  type InitiateVideoUploadRequest,
  type InitiateVideoUploadResult,
  type MediaReadUrlResult,
  type MediaVideoListItem,
} from "@globalscout/shared";

export function createMediaApi(client: ApiTransport) {
  return {
    initiateVideoUpload(body: InitiateVideoUploadRequest) {
      return client.post<InitiateVideoUploadResult>(
        mediaPaths.videoUploadUrl,
        body,
      );
    },

    completeVideoUpload(body: CompleteVideoUploadRequest) {
      return client.post<CompleteVideoUploadResponse>(
        mediaPaths.videoComplete,
        body,
      );
    },

    getMyVideos() {
      return client.get<MediaVideoListItem[]>(mediaPaths.videos);
    },

    getUserVideos(userId: string) {
      return client.get<MediaVideoListItem[]>(
        mediaPaths.videosForUser(userId),
      );
    },

    getMediaUrl(mediaId: string) {
      return client.get<MediaReadUrlResult>(mediaPaths.readUrl(mediaId));
    },

    deleteVideo(videoId: string) {
      return client.delete<DeleteVideoResponse>(
        mediaPaths.deleteVideo(videoId),
      );
    },
  };
}

export type MediaApi = ReturnType<typeof createMediaApi>;
