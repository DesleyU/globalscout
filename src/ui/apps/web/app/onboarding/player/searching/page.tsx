import type { Metadata } from "next";
import { SearchingPageClient } from "@/features/onboarding/player/searching-page-client";

export const metadata: Metadata = {
  title: "Searching databases",
};

export default function SearchingPage() {
  return <SearchingPageClient />;
}
