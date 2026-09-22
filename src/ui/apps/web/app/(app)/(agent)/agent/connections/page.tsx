import type { Metadata } from "next";
import { ConnectionsPageClient } from "@/features/connections/connections-page-client";
import { requireAgent } from "@/lib/auth";

export const metadata: Metadata = {
  title: "My Network",
};

export default async function AgentConnectionsPage() {
  await requireAgent();

  return <ConnectionsPageClient />;
}
