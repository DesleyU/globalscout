import type { MediaPhotoListItem } from "@globalscout/shared";
import { createMediaApi } from "@/lib/api/media";
import { createServerApiClient } from "@/lib/api/server";

export async function fetchMyPhotos(): Promise<MediaPhotoListItem[]> {
  const client = await createServerApiClient();
  return createMediaApi(client).getMyPhotos();
}
