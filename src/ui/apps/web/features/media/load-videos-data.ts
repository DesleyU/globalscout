import type { MediaVideoListItem } from "@globalscout/shared";
import { createMediaApi } from "@/lib/api/media";
import { createServerApiClient } from "@/lib/api/server";

export async function fetchMyVideos(): Promise<MediaVideoListItem[]> {
  const client = await createServerApiClient();
  return createMediaApi(client).getMyVideos();
}
