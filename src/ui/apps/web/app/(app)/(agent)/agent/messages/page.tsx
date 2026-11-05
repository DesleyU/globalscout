import type { Metadata } from "next";
import { EmptyConversationState } from "@/features/messages/empty-conversation-state";
import { requireAgent } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Messages",
};

export default async function AgentMessagesPage() {
  await requireAgent();

  return <EmptyConversationState />;
}
