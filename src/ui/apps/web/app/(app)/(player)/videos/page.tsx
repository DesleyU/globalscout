import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { MediaVideoListItem } from "@globalscout/shared";
import { VideosPageClient } from "@/features/media/videos-page-client";
import { fetchMyVideos } from "@/features/media/load-videos-data";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Videos",
};

export default async function VideosPage() {
  const session = await getSession();
  if (!session) {
    redirect("/sign-in");
  }

  let initialVideos: MediaVideoListItem[] = [];
  try {
    initialVideos = await fetchMyVideos();
  } catch {
    initialVideos = [];
  }

  return (
    <VideosPageClient
      initialVideos={initialVideos}
      accountType={session.user.accountType}
    />
  );
}
