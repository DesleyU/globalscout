import type {
  InitiateBannerUploadRequest,
  PresignedUploadResult,
  CompleteBannerUploadResponse,
} from "@globalscout/shared";
import { uploadFileToPresignedUrl } from "./presigned-upload";

export type UploadBannerFileOptions = {
  initiateUpload: (
    body: InitiateBannerUploadRequest,
  ) => Promise<PresignedUploadResult>;
  completeUpload: (body: { storageKey: string }) => Promise<CompleteBannerUploadResponse>;
  file: File;
};

/** Full banner upload flow: initiate via BFF → S3 PUT → complete via BFF. */
export async function uploadBannerFile({
  initiateUpload,
  completeUpload,
  file,
}: UploadBannerFileOptions): Promise<CompleteBannerUploadResponse> {
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
