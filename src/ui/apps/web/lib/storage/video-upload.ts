import type {
  CompleteVideoUploadRequest,
  CompleteVideoUploadResponse,
  InitiateVideoUploadRequest,
  InitiateVideoUploadResult,
} from "@globalscout/shared";
import { uploadFileToPresignedUrlWithProgress } from "./presigned-upload";

export type UploadVideoFileOptions = {
  initiateUpload: (
    body: InitiateVideoUploadRequest,
  ) => Promise<InitiateVideoUploadResult>;
  completeUpload: (
    body: CompleteVideoUploadRequest,
  ) => Promise<CompleteVideoUploadResponse>;
  file: File;
  metadata?: {
    title?: string | null;
    description?: string | null;
    tags?: string | null;
  };
  onProgress?: (progress: number) => void;
};

/** Full video upload flow: initiate via BFF → S3 PUT → complete via BFF. */
export async function uploadVideoFile({
  initiateUpload,
  completeUpload,
  file,
  metadata,
  onProgress,
}: UploadVideoFileOptions): Promise<CompleteVideoUploadResponse> {
  const contentType = file.type || "application/octet-stream";

  const initiate = await initiateUpload({
    fileName: file.name,
    contentType,
    contentLength: file.size,
  });

  await uploadFileToPresignedUrlWithProgress({
    uploadUrl: initiate.uploadUrl,
    file,
    contentType,
    method: initiate.httpMethod,
    onProgress,
  });

  return completeUpload({
    storageKey: initiate.storageKey,
    fileName: file.name,
    contentType,
    title: metadata?.title ?? null,
    description: metadata?.description ?? null,
    tags: metadata?.tags ?? null,
  });
}
