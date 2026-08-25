import type {
  InitiateAvatarUploadRequest,
  PresignedUploadResult,
  CompleteAvatarUploadResponse,
} from "@globalscout/shared";
import { uploadFileToPresignedUrl } from "./presigned-upload";

export type UploadAvatarFileOptions = {
  initiateUpload: (
    body: InitiateAvatarUploadRequest,
  ) => Promise<PresignedUploadResult>;
  completeUpload: (body: { storageKey: string }) => Promise<CompleteAvatarUploadResponse>;
  file: File;
};

/** Full avatar upload flow: initiate via BFF → S3 PUT → complete via BFF. */
export async function uploadAvatarFile({
  initiateUpload,
  completeUpload,
  file,
}: UploadAvatarFileOptions): Promise<CompleteAvatarUploadResponse> {
  const contentType = file.type || "application/octet-stream";

  const initiate = await initiateUpload({
    fileName: file.name,
    contentType,
    contentLength: file.size,
  });

  await uploadFileToPresignedUrl({
    uploadUrl: initiate.uploadUrl,
    file,
    contentType,
    method: initiate.httpMethod,
  });

  return completeUpload({
    storageKey: initiate.storageKey,
  });
}
