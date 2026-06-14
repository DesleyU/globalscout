"use client";

import type { AuthUserDto } from "@globalscout/shared";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Home, UserRound } from "lucide-react";
import { AuthBrandingPanel } from "@/components/auth/auth-branding-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SignOutButton } from "@/features/auth/sign-out-button";
import { formatUserDisplayName } from "@/lib/auth/format-user-display";

type AlreadySignedInPanelProps = {
  user: AuthUserDto;
  continueHref: string;
};

export function AlreadySignedInPanel({
  user,
  continueHref,
}: AlreadySignedInPanelProps) {
  const router = useRouter();
  const displayName = formatUserDisplayName(user);

  return (
    <Card className="overflow-hidden border-white/10 bg-white/5 shadow-2xl backdrop-blur-sm">
      <CardContent className="grid p-0 md:grid-cols-2">
        <AuthBrandingPanel variant="sign-in" />

        <div className="flex flex-col justify-center px-8 py-10 md:px-10">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600/20">
            <UserRound className="h-6 w-6 text-blue-300" aria-hidden />
          </div>

          <h1 className="mb-2 text-2xl font-bold text-white">
            You&apos;re already signed in
          </h1>
          <p className="mb-1 text-sm text-gray-400">
            Continue as{" "}
            <span className="font-medium text-white">{displayName}</span>
          </p>
          <p className="mb-8 text-sm text-gray-500">{user.email}</p>

          <div className="flex flex-col gap-3">
            <Button
              render={<Link href={continueHref} />}
              className="w-full bg-blue-600 text-white hover:bg-blue-700"
            >
              Continue where I left off
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Button>

            <SignOutButton
              redirectTo="/sign-in"
              className="w-full border-white/20 bg-transparent text-gray-200 hover:bg-white/10 hover:text-white"
            />

            <Button
              type="button"
              variant="ghost"
              className="w-full text-gray-400 hover:bg-white/5 hover:text-white"
              onClick={() => router.push("/")}
            >
              <Home className="h-4 w-4" aria-hidden />
              Back to home
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
