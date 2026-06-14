import type { Metadata } from "next";
import { ConnectPageClient } from "@/features/onboarding/player/connect-page-client";

export const metadata: Metadata = {
  title: "Connect football identity",
};

export default function ConnectPage() {
  return <ConnectPageClient />;
}
