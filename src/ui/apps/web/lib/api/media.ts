import {
  mediaPaths,
  type ApiTransport,
  type CompletePhotoUploadRequest,
  type CompletePhotoUploadResponse,
  type CompleteVideoUploadRequest,
  type CompleteVideoUploadResponse,
  type DeletePhotoResponse,
  type DeleteVideoResponse,
  type InitiatePhotoUploadRequest,
  type InitiatePhotoUploadResult,
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

    initiatePhotoUpload(body: InitiatePhotoUploadRequest) {
      return client.post<InitiatePhotoUploadResult>(
        mediaPaths.photoUploadUrl,
        body,
      );
    },

    completePhotoUpload(body: CompletePhotoUploadRequest) {
      return client.post<CompletePhotoUploadResponse>(
        mediaPaths.photoComplete,
        body,
      );
    },

    getMyPhotos() {
      return client.get<MediaVideoListItem[]>(mediaPaths.photos);
    },

    getUserPhotos(userId: string) {
      return client.get<MediaVideoListItem[]>(
        mediaPaths.photosForUser(userId),
      );
    },

    deletePhoto(photoId: string) {
      return client.delete<DeletePhotoResponse>(
        mediaPaths.deletePhoto(photoId),
      );
    },
  };
}

export type MediaApi = ReturnType<typeof createMediaApi>;
