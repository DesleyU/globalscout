import { ConversationsListClient } from "@/features/messages/conversations-list-client";
import { requireAgent } from "@/lib/auth";

export default async function AgentMessagesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAgent();

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <div className="w-full shrink-0 md:w-[360px] md:border-r md:border-gray-200">
        <ConversationsListClient variant="agent" />
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}
