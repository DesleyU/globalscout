export type PresignedUploadOptions = {
  uploadUrl: string;
  file: Blob;
  contentType?: string;
  method?: string;
  fetch?: typeof fetch;
};

/** Upload a file to a presigned object-storage URL (S3/MinIO). */
export async function uploadFileToPresignedUrl({
  uploadUrl,
  file,
  contentType,
  method = "PUT",
  fetch: fetchImpl = fetch,
}: PresignedUploadOptions): Promise<void> {
  const response = await fetchImpl(uploadUrl, {
    method: method.toUpperCase(),
    headers: {
      "Content-Type": contentType ?? file.type ?? "application/octet-stream",
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error(`Presigned upload failed with status ${response.status}`);
  }
}
