"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import type { PublicUserProfile } from "@globalscout/shared";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { SidebarVariant } from "@/components/layout/app-sidebar";
import { ONBOARDING_POSITIONS } from "@/features/onboarding/player/constants";
import { useConnectionStates } from "@/features/connections/use-connection-states";
import { NoteDialog } from "@/features/connections/note-dialog";

type UserProfileViewClientProps = {
  currentUserId: string;
  user: PublicUserProfile;
  variant?: SidebarVariant;
};

const ROLE_LABELS: Record<string, string> = {
  PLAYER: "Player",
  CLUB: "Club",
  SCOUT_AGENT: "Scout / Agent",
  ADMIN: "Admin",
};

function getInitials(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

export function UserProfileViewClient({
  currentUserId,
  user,
  variant = "player",
}: UserProfileViewClientProps) {
  const isAgent = variant === "agent";
  const networkHref = isAgent ? "/agent/connections" : "/connections";
  const messagesHref = isAgent ? "/agent/messages" : "/messages";
  const isSelf = user.id === currentUserId;

  const profile = user.profile;
  const name = `${profile.firstName} ${profile.lastName}`;
  const positionLabel = profile.position
    ? (ONBOARDING_POSITIONS.find((p) => p.value === profile.position)?.label ?? profile.position)
    : null;

  const [connectionStates, setConnectionStates] = useConnectionStates();
  const [isConnecting, setIsConnecting] = useState(false);
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const state = connectionStates.get(user.id);

  async function handleConnect(message: string) {
    setIsConnecting(true);
    try {
      const response = await fetch("/api/connections/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ receiverId: user.id, message: message || undefined }),
      });
      const data = (await response.json()) as { message?: string; error?: string };

      if (!response.ok) {
        toast.error(data.error ?? data.message ?? "Could not send connection request");
        return;
      }

      toast.success("Connection request sent");
      setConnectionStates((prev) => new Map(prev).set(user.id, "pending-sent"));
      setShowConnectDialog(false);
    } catch {
      toast.error("Could not send connection request");
    } finally {
      setIsConnecting(false);
    }
  }

  const details = [
    profile.city ? { label: "City", value: profile.city } : null,
    profile.height ? { label: "Height", value: `${profile.height} cm` } : null,
    profile.weight ? { label: "Weight", value: `${profile.weight} kg` } : null,
  ].filter((d): d is { label: string; value: string } => d !== null);

  const links = [
    profile.website ? { label: "Website", href: profile.website } : null,
    profile.instagram ? { label: "Instagram", href: profile.instagram } : null,
    profile.twitter ? { label: "Twitter", href: profile.twitter } : null,
    profile.linkedin ? { label: "LinkedIn", href: profile.linkedin } : null,
  ].filter((l): l is { label: string; href: string } => l !== null);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-8">
      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-4">
              <Avatar size="lg">
                {profile.avatar ? <AvatarImage src={profile.avatar} alt={name} /> : null}
                <AvatarFallback>{getInitials(profile.firstName, profile.lastName)}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{name}</h1>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{ROLE_LABELS[user.role] ?? user.role}</Badge>
                  {positionLabel ? <Badge variant="outline">{positionLabel}</Badge> : null}
                </div>
              </div>
            </div>

            {isSelf ? (
              <Button size="sm" variant="outline" render={<Link href="/profile" />}>
                Edit profile
              </Button>
            ) : state === "accepted" ? (
              <Button
                size="sm"
                variant="outline"
                render={<Link href={`${messagesHref}/${user.id}`} />}
              >
                Message
              </Button>
            ) : state === "pending-sent" ? (
              <span className="text-xs text-gray-500">Pending</span>
            ) : state === "pending-received" ? (
              <Button size="sm" variant="outline" render={<Link href={networkHref} />}>
                Respond in My Network
              </Button>
            ) : (
              <Button size="sm" disabled={isConnecting} onClick={() => setShowConnectDialog(true)}>
                {isConnecting ? "Sending..." : "Connect"}
              </Button>
            )}
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
            {profile.clubName ? <span>{profile.clubName}</span> : null}
            {profile.country ? <span>{profile.country}</span> : null}
            {profile.nationality ? <span>{profile.nationality}</span> : null}
            {profile.age ? <span>Age {profile.age}</span> : null}
          </div>

          {profile.bio ? <p className="text-sm text-gray-700">{profile.bio}</p> : null}

          {details.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 border-t pt-4 text-sm sm:grid-cols-3">
              {details.map((d) => (
                <div key={d.label}>
                  <div className="text-xs text-gray-500">{d.label}</div>
                  <div className="text-gray-900">{d.value}</div>
                </div>
              ))}
            </div>
          ) : null}

          {links.length > 0 ? (
            <div className="flex flex-wrap gap-3 border-t pt-4 text-sm">
              {links.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-primary hover:underline"
                >
                  {l.label}
                </a>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <NoteDialog
        open={showConnectDialog}
        onClose={() => setShowConnectDialog(false)}
        title={`Connect with ${name}`}
        description="Add an optional note to introduce yourself."
        placeholder="e.g. Hi, I'd like to connect..."
        confirmLabel="Send request"
        onConfirm={handleConnect}
      />
    </div>
  );
}
