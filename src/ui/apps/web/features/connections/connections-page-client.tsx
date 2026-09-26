"use client";

import { useEffect, useState } from "react";
import type { ConnectionListItem, ConnectionRequestRow } from "@globalscout/shared";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { NoteDialog } from "@/features/connections/note-dialog";

function getInitials(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

function UserRow({
  userId,
  role,
  firstName,
  lastName,
  avatar,
  note,
  children,
}: {
  userId: string;
  role: string;
  firstName: string;
  lastName: string;
  avatar?: string | null;
  note?: string | null;
  children?: React.ReactNode;
}) {
  const name = `${firstName} ${lastName}`;

  return (
    <Card key={userId}>
      <CardContent className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar>
            {avatar ? <AvatarImage src={avatar} alt={name} /> : null}
            <AvatarFallback>{getInitials(firstName, lastName)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="text-sm font-medium text-gray-900">{name}</div>
            <div className="text-xs text-gray-500">{role}</div>
            {note ? <div className="mt-1 text-xs text-gray-600 italic">&ldquo;{note}&rdquo;</div> : null}
          </div>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(path, { credentials: "include" });
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error((data as { error?: string }).error ?? "Request failed");
  }
  return data;
}

async function loadNetworkData() {
  const [receivedResult, sentResult, connectionsResult] = await Promise.all([
    fetchJson<{ requests: ConnectionRequestRow[] }>("/api/connections/requests?type=received"),
    fetchJson<{ requests: ConnectionRequestRow[] }>("/api/connections/requests?type=sent"),
    fetchJson<{ connections: ConnectionListItem[] }>("/api/connections?status=ACCEPTED"),
  ]);

  return {
    received: receivedResult.requests,
    sent: sentResult.requests,
    connections: connectionsResult.connections,
  };
}

export function ConnectionsPageClient() {
  const [received, setReceived] = useState<ConnectionRequestRow[]>([]);
  const [sent, setSent] = useState<ConnectionRequestRow[]>([]);
  const [connections, setConnections] = useState<ConnectionListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [respondTarget, setRespondTarget] = useState<{
    connectionId: string;
    action: "accept" | "reject";
    name: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadNetworkData()
      .then((data) => {
        if (cancelled) return;
        setReceived(data.received);
        setSent(data.sent);
        setConnections(data.connections);
      })
      .catch(() => {
        if (!cancelled) toast.error("Could not load your network");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function respond(connectionId: string, action: "accept" | "reject", message: string) {
    setPendingIds((prev) => new Set(prev).add(connectionId));

    try {
      const response = await fetch(`/api/connections/${connectionId}/respond`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action, message: message || undefined }),
      });
      const data = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        toast.error(data.error ?? data.message ?? "Could not respond to request");
        return;
      }

      toast.success(action === "accept" ? "Connection accepted" : "Connection rejected");
      const refreshed = await loadNetworkData();
      setReceived(refreshed.received);
      setSent(refreshed.sent);
      setConnections(refreshed.connections);
      setRespondTarget(null);
    } catch {
      toast.error("Could not respond to request");
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(connectionId);
        return next;
      });
    }
  }

  if (isLoading) {
    return <p className="p-8 text-sm text-gray-500">Loading...</p>;
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 p-8">
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-gray-900">
          Requests {received.length > 0 ? `(${received.length})` : null}
        </h2>
        {received.length === 0 ? (
          <p className="text-sm text-gray-500">No pending requests.</p>
        ) : (
          received.map((request) => {
            const senderName =
              `${request.sender.profile?.firstName ?? "Unknown"} ${request.sender.profile?.lastName ?? "user"}`.trim();

            return (
              <UserRow
                key={request.id}
                userId={request.sender.id}
                role={request.sender.role}
                firstName={request.sender.profile?.firstName ?? "Unknown"}
                lastName={request.sender.profile?.lastName ?? "user"}
                avatar={request.sender.profile?.avatar}
                note={request.message}
              >
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pendingIds.has(request.id)}
                    onClick={() =>
                      setRespondTarget({ connectionId: request.id, action: "reject", name: senderName })
                    }
                  >
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    disabled={pendingIds.has(request.id)}
                    onClick={() =>
                      setRespondTarget({ connectionId: request.id, action: "accept", name: senderName })
                    }
                  >
                    Accept
                  </Button>
                </div>
              </UserRow>
            );
          })
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-gray-900">Sent</h2>
        {sent.length === 0 ? (
          <p className="text-sm text-gray-500">No pending sent requests.</p>
        ) : (
          sent.map((request) => (
            <UserRow
              key={request.id}
              userId={request.receiver.id}
              role={request.receiver.role}
              firstName={request.receiver.profile?.firstName ?? "Unknown"}
              lastName={request.receiver.profile?.lastName ?? "user"}
              avatar={request.receiver.profile?.avatar}
              note={request.message}
            >
              <span className="text-xs text-gray-500">Pending</span>
            </UserRow>
          ))
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-gray-900">
          Connections {connections.length > 0 ? `(${connections.length})` : null}
        </h2>
        {connections.length === 0 ? (
          <p className="text-sm text-gray-500">No connections yet.</p>
        ) : (
          connections.map((connection) => (
            <UserRow
              key={connection.id}
              userId={connection.user.id}
              role={connection.user.role}
              firstName={connection.user.profile?.firstName ?? "Unknown"}
              lastName={connection.user.profile?.lastName ?? "user"}
              avatar={connection.user.profile?.avatar}
            />
          ))
        )}
      </section>

      <NoteDialog
        open={respondTarget !== null}
        onClose={() => setRespondTarget(null)}
        title={
          respondTarget?.action === "accept"
            ? `Accept ${respondTarget.name}'s request`
            : `Decline ${respondTarget?.name ?? ""}'s request`
        }
        description="Add an optional reply."
        placeholder="e.g. Great to connect!"
        confirmLabel={respondTarget?.action === "accept" ? "Accept" : "Decline"}
        confirmVariant={respondTarget?.action === "reject" ? "destructive" : "default"}
        onConfirm={(message) => {
          if (respondTarget) {
            return respond(respondTarget.connectionId, respondTarget.action, message);
          }
        }}
      />
    </div>
  );
}
