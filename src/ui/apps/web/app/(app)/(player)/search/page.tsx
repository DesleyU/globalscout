import type { Metadata } from "next";
import { SearchPageClient } from "@/features/search/search-page-client";
import { requirePlayer } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Search",
};

export default async function SearchPage() {
  const session = await requirePlayer();

  return <SearchPageClient currentUserId={session.user.id} />;
}
