import type { Metadata } from "next";
import { ConversationsListClient } from "@/features/messages/conversations-list-client";
import { requireAgent } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Messages",
};

export default async function AgentMessagesPage() {
  await requireAgent();

  return <ConversationsListClient variant="agent" />;
}
