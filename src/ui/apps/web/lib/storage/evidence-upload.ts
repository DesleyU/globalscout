import type {
  AddLinkEvidenceRequest,
  ApiTransport,
  EvidenceType,
  VerificationEvidenceDto,
} from "@globalscout/shared";
import { playerIdentityPaths } from "@globalscout/shared";
import { uploadFileToPresignedUrl } from "./presigned-upload";

export type UploadEvidenceFileOptions = {
  client: ApiTransport;
  file: File;
  type: EvidenceType;
  note?: string | null;
};

/** Full evidence upload flow: upload URL → S3 PUT → complete submission. */
export async function uploadEvidenceFile({
  client,
  file,
  type,
  note,
}: UploadEvidenceFileOptions): Promise<VerificationEvidenceDto> {
  const contentType = file.type || "application/octet-stream";

  const initiate = await client.post<{
    storageKey: string;
    uploadUrl: string;
    httpMethod: string;
    expiresAt: string;
  }>(playerIdentityPaths.evidenceUploadUrl, {
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

  return client.post<VerificationEvidenceDto>(
    playerIdentityPaths.evidenceComplete,
    {
      storageKey: initiate.storageKey,
      fileName: file.name,
      contentType,
      type,
      note,
    },
  );
}

export type SubmitLinkEvidenceOptions = {
  client: ApiTransport;
  body: AddLinkEvidenceRequest;
};

/** Submit URL-based verification evidence. */
export function submitLinkEvidence({
  client,
  body,
}: SubmitLinkEvidenceOptions): Promise<VerificationEvidenceDto> {
  return client.post<VerificationEvidenceDto>(
    playerIdentityPaths.evidenceLink,
    body,
  );
}

export { uploadFileToPresignedUrl } from "./presigned-upload";
