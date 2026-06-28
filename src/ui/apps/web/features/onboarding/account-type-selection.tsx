"use client";

import type { AuthUserDto } from "@globalscout/shared";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { AccountTypeCard } from "@/components/onboarding/account-type-card";
import { useSession } from "@/features/auth/session-provider";
import {
  DEFAULT_AGENT_REDIRECT,
  ROLES,
} from "@/lib/auth/roles";
import { ONBOARDING_EMPTY_PROFILE_PATH } from "@/lib/auth/onboarding-redirect";

type SelectableRole = typeof ROLES.PLAYER | typeof ROLES.SCOUT_AGENT;

const FALLBACK_REDIRECT: Record<SelectableRole, string> = {
  [ROLES.PLAYER]: ONBOARDING_EMPTY_PROFILE_PATH,
  [ROLES.SCOUT_AGENT]: DEFAULT_AGENT_REDIRECT,
};

export function AccountTypeSelection() {
  const router = useRouter();
  const { setUser } = useSession();
  const [pendingRole, setPendingRole] = useState<SelectableRole | null>(null);

  async function selectRole(role: SelectableRole) {
    if (pendingRole) {
      return;
    }

    setPendingRole(role);

    try {
      const response = await fetch("/api/account/set-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ role }),
      });

      const data = (await response.json()) as {
        user?: AuthUserDto;
        redirectTo?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Could not set account type");
      }

      if (data.user) {
        setUser(data.user);
      }

      router.push(data.redirectTo ?? FALLBACK_REDIRECT[role]);
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not set account type";
      toast.error(message);
      setPendingRole(null);
    }
  }

  return (
    <div className="grid w-full max-w-2xl grid-cols-1 gap-6 md:grid-cols-2">
      <AccountTypeCard
        variant="player"
        onSelect={() => selectRole(ROLES.PLAYER)}
        loading={pendingRole === ROLES.PLAYER}
        disabled={pendingRole !== null}
      />
      <AccountTypeCard
        variant="agent"
        onSelect={() => selectRole(ROLES.SCOUT_AGENT)}
        loading={pendingRole === ROLES.SCOUT_AGENT}
        disabled={pendingRole !== null}
      />
    </div>
  );
}
