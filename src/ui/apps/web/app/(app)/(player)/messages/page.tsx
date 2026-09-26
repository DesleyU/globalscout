import type { Metadata } from "next";
import { ConversationsListClient } from "@/features/messages/conversations-list-client";
import { requirePlayer } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Messages",
};

export default async function MessagesPage() {
  await requirePlayer();

  return <ConversationsListClient />;
}
