"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ConnectionListItem } from "@globalscout/shared";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { SidebarVariant } from "@/components/layout/app-sidebar";
import { useMessagesContext } from "@/features/messages/messages-provider";

type ConversationsListClientProps = {
  variant?: SidebarVariant;
};

function getInitials(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  return sameDay
    ? date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
    : date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function ConversationsListClient({ variant = "player" }: ConversationsListClientProps) {
  const isAgent = variant === "agent";
  const messagesHref = isAgent ? "/agent/messages" : "/messages";
  const messages = useMessagesContext();

  const conversations = messages?.conversations ?? [];
  const isLoadingConversations = messages?.isLoading ?? true;

  const [connections, setConnections] = useState<ConnectionListItem[]>([]);
  const [isLoadingConnections, setIsLoadingConnections] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/connections?status=ACCEPTED", { credentials: "include" })
      .then((response) => response.json())
      .then((data: { connections?: ConnectionListItem[] }) => {
        if (!cancelled) setConnections(data.connections ?? []);
      })
      .catch(() => {
        // Non-fatal: the "start a conversation" section just won't show anyone.
      })
      .finally(() => {
        if (!cancelled) setIsLoadingConnections(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const isLoading = isLoadingConversations || isLoadingConnections;
  const conversationPartnerIds = new Set(conversations.map((c) => c.otherUser.id));
  const connectionsWithoutConversation = connections.filter(
    (c) => !conversationPartnerIds.has(c.user.id),
  );

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-8">
      <h1 className="text-xl font-semibold text-gray-900">Messages</h1>

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : conversations.length === 0 && connectionsWithoutConversation.length === 0 ? (
        <p className="text-sm text-gray-500">
          No connections yet. Connect with someone to start messaging.
        </p>
      ) : (
        <>
          {conversations.length > 0 ? (
            <div className="flex flex-col gap-2">
              {conversations.map((conversation) => {
                const profile = conversation.otherUser.profile;
                const name = profile
                  ? `${profile.firstName} ${profile.lastName}`
                  : "Unknown user";
                const hasUnread = conversation.unreadCount > 0;

                return (
                  <Link key={conversation.id} href={`${messagesHref}/${conversation.otherUser.id}`}>
                    <Card className={hasUnread ? "border-blue-200 bg-blue-50/50" : undefined}>
                      <CardContent className="flex items-center gap-3">
                        <Avatar>
                          {profile?.profilePicture ? (
                            <AvatarImage src={profile.profilePicture} alt={name} />
                          ) : null}
                          <AvatarFallback>
                            {profile ? getInitials(profile.firstName, profile.lastName) : "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`truncate text-sm ${hasUnread ? "font-semibold text-gray-900" : "font-medium text-gray-900"}`}
                            >
                              {name}
                            </span>
                            <span className="shrink-0 text-xs text-gray-500">
                              {formatTimestamp(conversation.lastMessage.createdAt)}
                            </span>
                          </div>
                          <p
                            className={`truncate text-xs ${hasUnread ? "font-medium text-gray-800" : "text-gray-500"}`}
                          >
                            {conversation.lastMessage.content}
                          </p>
                        </div>
                        {hasUnread ? (
                          <Badge className="border-0 bg-blue-600 text-white">
                            {conversation.unreadCount}
                          </Badge>
                        ) : null}
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          ) : null}

          {connectionsWithoutConversation.length > 0 ? (
            <div className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold text-gray-900">
                Start a conversation
              </h2>
              {connectionsWithoutConversation.map((connection) => {
                const profile = connection.user.profile;
                const name = profile
                  ? `${profile.firstName} ${profile.lastName}`
                  : "Unknown user";

                return (
                  <Link key={connection.id} href={`${messagesHref}/${connection.user.id}`}>
                    <Card>
                      <CardContent className="flex items-center gap-3">
                        <Avatar>
                          {profile?.avatar ? <AvatarImage src={profile.avatar} alt={name} /> : null}
                          <AvatarFallback>
                            {profile ? getInitials(profile.firstName, profile.lastName) : "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-gray-900">{name}</div>
                          <div className="text-xs text-gray-500">
                            {connection.user.role}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
