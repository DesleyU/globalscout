import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchPageClient } from "@/features/search/search-page-client";
import { requireAgent } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Search",
};

export default async function AgentSearchPage() {
  const session = await requireAgent();

  return (
    <Suspense>
      <SearchPageClient currentUserId={session.user.id} variant="agent" />
    </Suspense>
  );
}
