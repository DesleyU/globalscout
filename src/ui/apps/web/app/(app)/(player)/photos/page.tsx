import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { MediaPhotoListItem } from "@globalscout/shared";
import { PhotosPageClient } from "@/features/media/photos-page-client";
import { fetchMyPhotos } from "@/features/media/load-photos-data";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Photos",
};

export default async function PhotosPage() {
  const session = await getSession();
  if (!session) {
    redirect("/sign-in");
  }

  let initialPhotos: MediaPhotoListItem[] = [];
  try {
    initialPhotos = await fetchMyPhotos();
  } catch {
    initialPhotos = [];
  }

  return (
    <PhotosPageClient
      initialPhotos={initialPhotos}
      accountType={session.user.accountType}
    />
  );
}
