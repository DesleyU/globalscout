"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { SignOutButton } from "@/features/auth/sign-out-button";
import { useSession } from "@/features/auth/session-provider";
import { formatUserDisplayName } from "@/lib/auth/format-user-display";
import { cn } from "@/lib/utils";

type OnboardingSessionActionsProps = {
  variant?: "dark" | "light";
  showExit?: boolean;
};

export function OnboardingSessionActions({
  variant = "dark",
  showExit = true,
}: OnboardingSessionActionsProps) {
  const { user } = useSession();
  const isDark = variant === "dark";

  if (!user) {
    return showExit ? (
      <Link
        href="/"
        className={cn(
          "flex items-center gap-1 text-sm transition-colors",
          isDark
            ? "text-gray-400 hover:text-white"
            : "text-gray-500 hover:text-gray-900",
        )}
      >
        <X className="h-4 w-4" aria-hidden />
        Exit
      </Link>
    ) : null;
  }

  const displayName = formatUserDisplayName(user);

  return (
    <div className="flex items-center gap-3 sm:gap-4">
      <div className="hidden text-right sm:block">
        <p
          className={cn(
            "text-sm font-medium",
            isDark ? "text-white" : "text-gray-900",
          )}
        >
          {displayName}
        </p>
        <p className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>
          {user.email}
        </p>
      </div>

      <SignOutButton
        redirectTo="/"
        className={cn(
          "h-8 px-3 text-xs",
          isDark
            ? "border-white/20 bg-transparent text-gray-300 hover:bg-white/10 hover:text-white"
            : "border-gray-200 text-gray-600 hover:bg-gray-50",
        )}
      />

      {showExit ? (
        <Link
          href="/"
          className={cn(
            "flex items-center gap-1 text-sm transition-colors",
            isDark
              ? "text-gray-400 hover:text-white"
              : "text-gray-500 hover:text-gray-900",
          )}
        >
          <X className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">Exit</span>
        </Link>
      ) : null}
    </div>
  );
}
