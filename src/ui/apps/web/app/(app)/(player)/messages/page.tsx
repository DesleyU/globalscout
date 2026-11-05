import type { Metadata } from "next";
import { EmptyConversationState } from "@/features/messages/empty-conversation-state";
import { requirePlayer } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Messages",
};

export default async function MessagesPage() {
  await requirePlayer();

  return <EmptyConversationState />;
}
