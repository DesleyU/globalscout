"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useSession } from "@/features/auth/session-provider";

type SignOutButtonProps = {
  className?: string;
  redirectTo?: string;
};

export function SignOutButton({
  className,
  redirectTo = "/sign-in",
}: SignOutButtonProps) {
  const router = useRouter();
  const { setUser } = useSession();
  const [isPending, setIsPending] = useState(false);

  async function handleSignOut() {
    setIsPending(true);

    try {
      const response = await fetch("/api/auth/sign-out", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Sign out failed");
      }

      setUser(null);
      router.push(redirectTo);
      router.refresh();
    } catch {
      toast.error("Could not sign out. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      className={className}
      disabled={isPending}
      onClick={handleSignOut}
    >
      {isPending ? "Signing out..." : "Sign out"}
    </Button>
  );
}
