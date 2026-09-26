import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ConversationThreadClient } from "@/features/messages/conversation-thread-client";
import { fetchPublicUserProfile } from "@/features/profile/load-user-profile";
import { requireAgent } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Conversation",
};

type ConversationPageProps = {
  params: Promise<{ userId: string }>;
};

export default async function AgentConversationPage({ params }: ConversationPageProps) {
  const { userId } = await params;
  const session = await requireAgent();

  const otherUser = await fetchPublicUserProfile(userId);
  if (!otherUser) {
    notFound();
  }

  return (
    <ConversationThreadClient
      currentUserId={session.user.id}
      otherUserId={userId}
      otherUserName={`${otherUser.profile.firstName} ${otherUser.profile.lastName}`}
      otherUserAvatar={otherUser.profile.avatar}
      variant="agent"
    />
  );
}
