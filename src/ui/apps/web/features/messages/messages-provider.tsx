"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as signalR from "@microsoft/signalr";
import type { ConversationListItem, MessageDetail } from "@globalscout/shared";
import { getPublicApiOrigin } from "@/lib/env";

type MessagesContextValue = {
  conversations: ConversationListItem[];
  totalUnread: number;
  isLoading: boolean;
  /** Changes identity on every incoming push - consumers watch it in a useEffect. */
  lastReceivedMessage: MessageDetail | null;
  refetchConversations: () => Promise<void>;
  /** Zeroes a conversation's unread count in the shared list (e.g. after opening its thread). */
  markConversationReadLocally: (otherUserId: string) => void;
};

const MessagesContext = createContext<MessagesContextValue | null>(null);

async function fetchRealtimeToken(): Promise<string> {
  const response = await fetch("/api/realtime/token", { credentials: "include" });
  if (!response.ok) {
    return "";
  }
  const { token } = (await response.json()) as { token: string };
  return token;
}

async function fetchConversations(): Promise<ConversationListItem[]> {
  const response = await fetch("/api/messages/conversations", { credentials: "include" });
  if (!response.ok) {
    throw new Error("Could not load conversations");
  }
  const data = (await response.json()) as { conversations: ConversationListItem[] };
  return data.conversations;
}

export function MessagesProvider({ children }: { children: React.ReactNode }) {
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastReceivedMessage, setLastReceivedMessage] = useState<MessageDetail | null>(null);
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  const refetchConversations = useCallback(async () => {
    try {
      setConversations(await fetchConversations());
    } catch {
      // Non-fatal: badge/list just won't update until the next successful refetch.
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    refetchConversations().finally(() => {
      if (!cancelled) setIsLoading(false);
    });

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${getPublicApiOrigin()}/hubs/messages`, {
        accessTokenFactory: fetchRealtimeToken,
      })
      .withAutomaticReconnect()
      .build();

    connection.on("ReceiveMessage", (message: MessageDetail) => {
      setLastReceivedMessage(message);
      setConversations((prev) => {
        const otherUserId = message.senderId;
        const existing = prev.find((c) => c.otherUser.id === otherUserId);

        if (!existing) {
          // First message from a new conversation partner - refetch to pick up the new row
          // (constructing it client-side would need data this push doesn't carry, e.g. role).
          void refetchConversations();
          return prev;
        }

        const updated: ConversationListItem = {
          ...existing,
          lastMessage: {
            id: message.id,
            content: message.content,
            senderId: message.senderId,
            receiverId: message.receiverId,
            createdAt: message.createdAt,
            isRead: message.isRead,
          },
          unreadCount: existing.unreadCount + 1,
        };

        return [updated, ...prev.filter((c) => c.otherUser.id !== otherUserId)];
      });
    });

    connectionRef.current = connection;
    connection.start().catch(() => {});

    return () => {
      cancelled = true;
      connectionRef.current = null;
      void connection.stop();
    };
  }, [refetchConversations]);

  const markConversationReadLocally = useCallback((otherUserId: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.otherUser.id === otherUserId ? { ...c, unreadCount: 0 } : c)),
    );
  }, []);

  const totalUnread = useMemo(
    () => conversations.reduce((sum, c) => sum + c.unreadCount, 0),
    [conversations],
  );

  const value = useMemo(
    () => ({
      conversations,
      totalUnread,
      isLoading,
      lastReceivedMessage,
      refetchConversations,
      markConversationReadLocally,
    }),
    [conversations, totalUnread, isLoading, lastReceivedMessage, refetchConversations, markConversationReadLocally],
  );

  return <MessagesContext.Provider value={value}>{children}</MessagesContext.Provider>;
}

/** Returns null when rendered outside a MessagesProvider (e.g. the admin shell). */
export function useMessagesContext(): MessagesContextValue | null {
  return useContext(MessagesContext);
}
