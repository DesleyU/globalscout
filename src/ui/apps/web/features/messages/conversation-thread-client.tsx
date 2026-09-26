"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import type { MessageThreadItem } from "@globalscout/shared";
import { ArrowLeft } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SidebarVariant } from "@/components/layout/app-sidebar";
import { useMessagesContext } from "@/features/messages/messages-provider";

type ConversationThreadClientProps = {
  currentUserId: string;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar?: string | null;
  variant?: SidebarVariant;
};

function getInitials(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

export function ConversationThreadClient({
  currentUserId,
  otherUserId,
  otherUserName,
  otherUserAvatar,
  variant = "player",
}: ConversationThreadClientProps) {
  const isAgent = variant === "agent";
  const messagesHref = isAgent ? "/agent/messages" : "/messages";
  const messagesContext = useMessagesContext();

  const [messages, setMessages] = useState<MessageThreadItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const hasScrolledInitially = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(
          `/api/messages/conversation/${otherUserId}?page=1&limit=30`,
          { credentials: "include" },
        );
        const data = (await response.json()) as {
          messages?: MessageThreadItem[];
          hasMore?: boolean;
          error?: string;
        };
        if (!response.ok) {
          toast.error(data.error ?? "Could not load conversation");
          return;
        }
        if (cancelled) return;
        setMessages(data.messages ?? []);
        setHasMore(data.hasMore ?? false);
        setPage(1);
        messagesContext?.markConversationReadLocally(otherUserId);
      } catch {
        if (!cancelled) toast.error("Could not load conversation");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- markConversationReadLocally is stable per provider instance
  }, [otherUserId]);

  useEffect(() => {
    if (!isLoading && !hasScrolledInitially.current) {
      bottomRef.current?.scrollIntoView({ behavior: "auto" });
      hasScrolledInitially.current = true;
    }
  }, [isLoading]);

  // Live messages pushed over SignalR for this open thread.
  useEffect(() => {
    const incoming = messagesContext?.lastReceivedMessage;
    if (!incoming) return;
    if (incoming.senderId !== otherUserId) return;

    setMessages((prev) =>
      prev.some((m) => m.id === incoming.id)
        ? prev
        : [
            ...prev,
            {
              id: incoming.id,
              senderId: incoming.senderId,
              receiverId: incoming.receiverId,
              content: incoming.content,
              createdAt: incoming.createdAt,
              isRead: incoming.isRead,
              sender: {
                id: incoming.sender.id,
                profile: incoming.sender.profile
                  ? {
                      firstName: incoming.sender.profile.firstName,
                      lastName: incoming.sender.profile.lastName,
                      avatar: incoming.sender.profile.avatar,
                    }
                  : null,
              },
            },
          ],
    );
    messagesContext?.markConversationReadLocally(otherUserId);
    void fetch(`/api/messages/read/${otherUserId}`, { method: "PUT", credentials: "include" });
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when a new push arrives
  }, [messagesContext?.lastReceivedMessage]);

  async function handleLoadOlder() {
    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const response = await fetch(
        `/api/messages/conversation/${otherUserId}?page=${nextPage}&limit=30`,
        { credentials: "include" },
      );
      const data = (await response.json()) as {
        messages?: MessageThreadItem[];
        hasMore?: boolean;
        error?: string;
      };
      if (!response.ok) {
        toast.error(data.error ?? "Could not load older messages");
        return;
      }
      setMessages((prev) => [...(data.messages ?? []), ...prev]);
      setHasMore(data.hasMore ?? false);
      setPage(nextPage);
    } catch {
      toast.error("Could not load older messages");
    } finally {
      setIsLoadingMore(false);
    }
  }

  async function handleSend(event: React.FormEvent) {
    event.preventDefault();
    const content = draft.trim();
    if (!content) return;

    setIsSending(true);
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ receiverId: otherUserId, content }),
      });
      const data = (await response.json()) as { data?: MessageThreadItem; error?: string };

      if (!response.ok) {
        toast.error(data.error ?? "Could not send message");
        return;
      }

      if (data.data) {
        setMessages((prev) => [...prev, data.data as MessageThreadItem]);
      }
      setDraft("");
      void messagesContext?.refetchConversations();
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch {
      toast.error("Could not send message");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-2xl flex-col p-8">
      <div className="mb-3 flex items-center gap-2">
        <Button size="sm" variant="ghost" render={<Link href={messagesHref} />}>
          <ArrowLeft className="size-4" aria-hidden />
        </Button>
        <Avatar size="sm">
          {otherUserAvatar ? <AvatarImage src={otherUserAvatar} alt={otherUserName} /> : null}
          <AvatarFallback>
            {otherUserName
              .split(" ")
              .map((p) => p[0])
              .join("")
              .toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <h1 className="text-lg font-semibold text-gray-900">{otherUserName}</h1>
      </div>

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto rounded-lg border bg-white p-4">
        {isLoading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : (
          <>
            {hasMore ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isLoadingMore}
                className="mx-auto"
                onClick={() => void handleLoadOlder()}
              >
                {isLoadingMore ? "Loading..." : "Load older messages"}
              </Button>
            ) : null}

            {messages.length === 0 ? (
              <p className="text-sm text-gray-500">No messages yet. Say hello!</p>
            ) : (
              messages.map((message) => {
                const isMine = message.senderId === currentUserId;
                return (
                  <div
                    key={message.id}
                    className={`flex items-end gap-2 ${isMine ? "flex-row-reverse" : ""}`}
                  >
                    <Avatar size="sm">
                      {message.sender?.profile?.avatar ? (
                        <AvatarImage src={message.sender.profile.avatar} alt="" />
                      ) : null}
                      <AvatarFallback>
                        {message.sender?.profile
                          ? getInitials(
                              message.sender.profile.firstName,
                              message.sender.profile.lastName,
                            )
                          : "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                        isMine ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      <form onSubmit={handleSend} className="mt-3 flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message..."
          aria-label="Message"
          disabled={isSending}
        />
        <Button type="submit" disabled={isSending || !draft.trim()}>
          {isSending ? "Sending..." : "Send"}
        </Button>
      </form>
    </div>
  );
}
