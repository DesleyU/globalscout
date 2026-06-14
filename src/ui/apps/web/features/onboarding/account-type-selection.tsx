"use client";

import type { AuthUserDto } from "@globalscout/shared";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { AccountTypeCard } from "@/components/onboarding/account-type-card";
import { useSession } from "@/features/auth/session-provider";
import { ONBOARDING_EMPTY_PROFILE_PATH } from "@/lib/auth/onboarding-redirect";

export function AccountTypeSelection() {
  const router = useRouter();
  const { setUser } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function selectPlayer() {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/account/set-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ role: "PLAYER" }),
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

      router.push(data.redirectTo ?? ONBOARDING_EMPTY_PROFILE_PATH);
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not set account type";
      toast.error(message);
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid w-full max-w-2xl grid-cols-1 gap-6 md:grid-cols-2">
      <AccountTypeCard
        variant="player"
        onSelect={selectPlayer}
        loading={isSubmitting}
      />
      <AccountTypeCard variant="agent" disabled />
    </div>
  );
}
