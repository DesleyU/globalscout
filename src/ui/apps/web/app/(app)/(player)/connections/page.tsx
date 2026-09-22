import type { Metadata } from "next";
import { ConnectionsPageClient } from "@/features/connections/connections-page-client";
import { requirePlayer } from "@/lib/auth";

export const metadata: Metadata = {
  title: "My Network",
};

export default async function ConnectionsPage() {
  await requirePlayer();

  return <ConnectionsPageClient />;
}
