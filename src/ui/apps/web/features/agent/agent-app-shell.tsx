import type { AuthUserDto } from "@globalscout/shared";
import { AppShellLayout } from "@/components/layout/app-shell-layout";

export function AgentAppShell({
  user,
  children,
}: {
  user: AuthUserDto;
  children: React.ReactNode;
}) {
  return (
    <AppShellLayout user={user} variant="agent">
      {children}
    </AppShellLayout>
  );
}
