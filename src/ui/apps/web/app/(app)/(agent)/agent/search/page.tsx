import type { Metadata } from "next";
import { SearchPageClient } from "@/features/search/search-page-client";
import { requireAgent } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Search",
};

export default async function AgentSearchPage() {
  const session = await requireAgent();

  return <SearchPageClient currentUserId={session.user.id} variant="agent" />;
}
