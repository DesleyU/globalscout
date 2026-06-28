import { requirePendingOnboarding } from "@/lib/auth";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requirePendingOnboarding();

  return children;
}
