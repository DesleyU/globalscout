import { MessageSquare } from "lucide-react";

export function EmptyConversationState() {
  return (
    <div className="hidden h-full flex-col items-center justify-center gap-2 p-8 text-center md:flex">
      <MessageSquare className="size-8 text-gray-300" aria-hidden />
      <p className="text-sm text-gray-500">Select a conversation to start messaging.</p>
    </div>
  );
}
