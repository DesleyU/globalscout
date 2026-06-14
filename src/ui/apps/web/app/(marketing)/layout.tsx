import type { Metadata } from "next";
import { APP_NAME } from "@globalscout/shared";

export const metadata: Metadata = {
  title: `${APP_NAME} — Connect Football Talent Worldwide`,
  description:
    "GlobalScout connects players, scouts, and clubs with verified football profiles, performance data, and direct messaging.",
};

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
