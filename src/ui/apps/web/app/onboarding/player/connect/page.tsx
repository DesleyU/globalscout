import type { Metadata } from "next";
import { ConnectPageClient } from "@/features/onboarding/player/connect-page-client";
import { requireSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Connect football identity",
};

export default async function ConnectPage() {
  const session = await requireSession("/onboarding/player/connect");

  return (
    <ConnectPageClient
      profileDefaults={{
        firstName: session.user.profile?.firstName?.trim() ?? "",
        lastName: session.user.profile?.lastName?.trim() ?? "",
      }}
    />
  );
}
