export type PresignedUploadOptions = {
  uploadUrl: string;
  file: Blob;
  contentType?: string;
  method?: string;
  fetch?: typeof fetch;
};

export type PresignedUploadWithProgressOptions = PresignedUploadOptions & {
  onProgress?: (progress: number) => void;
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

/** Upload with XMLHttpRequest so upload progress can be reported. */
export function uploadFileToPresignedUrlWithProgress({
  uploadUrl,
  file,
  contentType,
  method = "PUT",
  onProgress,
}: PresignedUploadWithProgressOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method.toUpperCase(), uploadUrl);
    xhr.setRequestHeader(
      "Content-Type",
      contentType ?? file.type ?? "application/octet-stream",
    );

    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }

      reject(new Error(`Presigned upload failed with status ${xhr.status}`));
    };

    xhr.onerror = () => {
      reject(new Error("Presigned upload failed"));
    };

    xhr.send(file);
  });
}
