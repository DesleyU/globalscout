import { AppShell } from "@/features/dashboard/app-shell";
import { requireSession } from "@/lib/auth";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireSession();

  return <AppShell>{children}</AppShell>;
}
