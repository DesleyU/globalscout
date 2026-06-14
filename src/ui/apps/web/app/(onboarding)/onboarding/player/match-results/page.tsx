import type { Metadata } from "next";
import { MatchResultsPageClient } from "@/features/onboarding/player/match-results-page-client";

export const metadata: Metadata = {
  title: "Match results",
};

export default function MatchResultsPage() {
  return <MatchResultsPageClient />;
}
