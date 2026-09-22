"use client";

import { type Dispatch, type SetStateAction, useEffect, useState } from "react";
import type { ConnectionListItem, ConnectionRequestRow } from "@globalscout/shared";

export type ConnectionState = "accepted" | "pending-sent" | "pending-received";

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(path, { credentials: "include" });
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error((data as { error?: string }).error ?? "Request failed");
  }
  return data;
}

/** Loads the caller's connection/request state, keyed by the other user's id. */
export function useConnectionStates(): [
  Map<string, ConnectionState>,
  Dispatch<SetStateAction<Map<string, ConnectionState>>>,
] {
  const [connectionStates, setConnectionStates] = useState<Map<string, ConnectionState>>(
    new Map(),
  );

  useEffect(() => {
    async function load() {
      try {
        const [accepted, sent, received] = await Promise.all([
          fetchJson<{ connections: ConnectionListItem[] }>("/api/connections?status=ACCEPTED"),
          fetchJson<{ requests: ConnectionRequestRow[] }>("/api/connections/requests?type=sent"),
          fetchJson<{ requests: ConnectionRequestRow[] }>(
            "/api/connections/requests?type=received",
          ),
        ]);

        const states = new Map<string, ConnectionState>();
        for (const c of accepted.connections) states.set(c.user.id, "accepted");
        for (const r of sent.requests) states.set(r.receiver.id, "pending-sent");
        for (const r of received.requests) states.set(r.sender.id, "pending-received");
        setConnectionStates(states);
      } catch {
        // Non-fatal: callers still work, buttons just won't reflect existing state.
      }
    }

    void load();
  }, []);

  return [connectionStates, setConnectionStates];
}
