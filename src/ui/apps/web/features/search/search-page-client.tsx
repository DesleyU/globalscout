"use client";

import { useEffect, useState } from "react";
import type {
  ConnectionListItem,
  ConnectionRequestRow,
  SearchUserItem,
} from "@globalscout/shared";
import Link from "next/link";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { SidebarVariant } from "@/components/layout/app-sidebar";

type SearchPageClientProps = {
  currentUserId: string;
  variant?: SidebarVariant;
};

type ConnectionState = "accepted" | "pending-sent" | "pending-received";

function getInitials(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(path, { credentials: "include" });
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error((data as { error?: string }).error ?? "Request failed");
  }
  return data;
}

export function SearchPageClient({ currentUserId, variant = "player" }: SearchPageClientProps) {
  const networkHref = variant === "agent" ? "/agent/connections" : "/connections";

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchUserItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [connectionStates, setConnectionStates] = useState<Map<string, ConnectionState>>(
    new Map(),
  );

  useEffect(() => {
    async function loadConnectionStates() {
      try {
        const [accepted, sent, receivedRequests] = await Promise.all([
          fetchJson<{ connections: ConnectionListItem[] }>("/api/connections?status=ACCEPTED"),
          fetchJson<{ requests: ConnectionRequestRow[] }>("/api/connections/requests?type=sent"),
          fetchJson<{ requests: ConnectionRequestRow[] }>(
            "/api/connections/requests?type=received",
          ),
        ]);

        const states = new Map<string, ConnectionState>();
        for (const c of accepted.connections) states.set(c.user.id, "accepted");
        for (const r of sent.requests) states.set(r.receiver.id, "pending-sent");
        for (const r of receivedRequests.requests) states.set(r.sender.id, "pending-received");
        setConnectionStates(states);
      } catch {
        // Non-fatal: search still works, buttons just won't reflect existing state.
      }
    }

    void loadConnectionStates();
  }, []);

  async function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    setIsSearching(true);
    setHasSearched(true);

    try {
      const response = await fetch(
        `/api/users/search?q=${encodeURIComponent(query)}`,
        { credentials: "include" },
      );
      const data = (await response.json()) as { users?: SearchUserItem[]; error?: string };

      if (!response.ok) {
        toast.error(data.error ?? "Search failed");
        setResults([]);
        return;
      }

      setResults(data.users ?? []);
    } catch {
      toast.error("Search failed");
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }

  async function handleConnect(userId: string) {
    setPendingIds((prev) => new Set(prev).add(userId));

    try {
      const response = await fetch("/api/connections/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ receiverId: userId }),
      });
      const data = (await response.json()) as { message?: string; error?: string };

      if (!response.ok) {
        toast.error(data.error ?? data.message ?? "Could not send connection request");
        return;
      }

      toast.success("Connection request sent");
      setConnectionStates((prev) => new Map(prev).set(userId, "pending-sent"));
    } catch {
      toast.error("Could not send connection request");
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-8">
      <h1 className="text-xl font-semibold text-gray-900">Search</h1>

      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name..."
          aria-label="Search users"
        />
        <Button type="submit" disabled={isSearching}>
          {isSearching ? "Searching..." : "Search"}
        </Button>
      </form>

      <div className="flex flex-col gap-2">
        {hasSearched && !isSearching && results.length === 0 ? (
          <p className="text-sm text-gray-500">No users found.</p>
        ) : null}

        {results.map((user) => {
          const profile = user.profile;
          const name = profile ? `${profile.firstName} ${profile.lastName}` : "Unknown user";
          const isSelf = user.id === currentUserId;
          const state = connectionStates.get(user.id);
          const isPending = pendingIds.has(user.id);

          return (
            <Card key={user.id}>
              <CardContent className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar>
                    {profile?.avatar ? <AvatarImage src={profile.avatar} alt={name} /> : null}
                    <AvatarFallback>
                      {profile ? getInitials(profile.firstName, profile.lastName) : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{name}</div>
                    <div className="text-xs text-gray-500">{user.role}</div>
                  </div>
                </div>

                {isSelf ? (
                  <span className="text-xs text-gray-500">You</span>
                ) : state === "accepted" ? (
                  <span className="text-xs text-gray-500">Connected</span>
                ) : state === "pending-sent" ? (
                  <span className="text-xs text-gray-500">Pending</span>
                ) : state === "pending-received" ? (
                  <Button size="sm" variant="outline" render={<Link href={networkHref} />}>
                    Respond in My Network
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    disabled={isPending}
                    onClick={() => void handleConnect(user.id)}
                  >
                    {isPending ? "Sending..." : "Connect"}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
